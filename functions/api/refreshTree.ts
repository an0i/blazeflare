import { z } from "zod";
import { convertObjectToResponse, getB2AuthorizeAccount } from "../utils";

const b2ListFileNamesNoFolderFileSchema = z.object({
  accountId: z.string(),
  action: z.union([z.literal("start"), z.literal("upload"), z.literal("hide")]),
  bucketId: z.string(),
  contentLength: z.number(),
  contentSha1: z.string().nullish(),
  contentMd5: z.string().nullish(),
  contentType: z.string(),
  fileId: z.string(),
  fileName: z.string(),
  uploadTimestamp: z.number(),
});

const b2ListFileNamesNoFolderSchema = z.object({
  files: b2ListFileNamesNoFolderFileSchema.array(),
  nextFileName: z.string().nullish(),
});

async function getAllFileNames(bucketId, apiUrl, authorizationToken) {
  let allFiles = [];
  let nextFileName: string | null | undefined = "";
  while (typeof nextFileName === "string") {
    const search =
      nextFileName === ""
        ? new URLSearchParams({
            bucketId: bucketId,
            maxFileCount: "1000",
          })
        : new URLSearchParams({
            bucketId: bucketId,
            maxFileCount: "1000",
            startFileName: nextFileName,
          });

    const temp = b2ListFileNamesNoFolderSchema.parse(
      await (
        await fetch(`${apiUrl}/b2api/v2/b2_list_file_names?${search}`, {
          headers: {
            Authorization: authorizationToken,
          },
        })
      ).json(),
    );
    nextFileName = temp.nextFileName;
    allFiles.push(...temp.files);
  }
  return allFiles;
}

function filesToTree(allFiles) {
  type Node =
    | {
        isFolder: true;
        name: string;
        nodes: Node[];
      }
    | { isFolder: false; name: string; id: string; birth: number; size: number; mime: string; sha1?: string | null; md5?: string | null };
  const fileTree: Node = {
    isFolder: true,
    name: "root",
    nodes: [],
  };
  allFiles.forEach((file) => {
    let current: Node = fileTree;
    const segments = file.fileName.split("/");
    segments.slice(0, -1).forEach((segment) => {
      if (current.isFolder) {
        current =
          current.nodes.find((node) => node.isFolder && node.name === segment) ||
          current.nodes[
            current.nodes.push({
              isFolder: true,
              name: segment,
              nodes: [],
            }) - 1
          ];
      }
    });
    current.nodes.push({
      isFolder: false,
      name: segments[segments.length - 1],
      id: file.fileId,
      birth: file.uploadTimestamp,
      size: file.contentLength,
      mime: file.contentType,
      sha1: file.contentSha1,
      md5: file.contentMd5,
    });
  });

  // sort fileTree
  {
    function sortNode(node: Node) {
      if (node.isFolder) {
        node.nodes.sort((a, b) => {
          if (a.isFolder && !b.isFolder) return -1;
          if (!a.isFolder && b.isFolder) return 1;
          return a.name.localeCompare(b.name, "zh");
        });
        node.nodes.forEach(sortNode);
      }
    }
    sortNode(fileTree);
  }
  return fileTree;
}

export const onRequestGet: PagesFunction<{ BLAZEFLARE_KV: KVNamespace }> = async (context) => {
  const { id, key } = z
    .object({
      id: z.string().min(1),
      key: z.string().min(1),
    })
    .parse(JSON.parse(await context.env.BLAZEFLARE_KV.get("config")));
  const {
    authorizationToken,
    allowed: { bucketId },
    apiUrl,
  } = await getB2AuthorizeAccount(id, key);

  const allFiles = await getAllFileNames(bucketId, apiUrl, authorizationToken);
  const tree = filesToTree(allFiles);

  await context.env.BLAZEFLARE_KV.put("tree", JSON.stringify(tree));

  return convertObjectToResponse({
    success: true,
    message: "成功更新文件索引",
    payload: {
      count: allFiles.length,
    },
  });
};
