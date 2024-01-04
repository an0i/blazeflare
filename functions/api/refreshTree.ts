import { z } from "zod";
import { TreeNode, Utils } from "../utils";

export const onRequestGet: PagesFunction = async (context) => {
  const kv = Utils.getKv(context);

  const {
    authorizationToken,
    allowed: { bucketId },
    apiUrl,
  } = await Utils.get_b2_authorize_account(context);

  const allFiles = await getAllFiles_b2_list_file_names(bucketId, apiUrl, authorizationToken);
  const tree = filesToTree(allFiles);
  sortTreeNode(tree);
  await kv.put("tree", JSON.stringify(tree));

  return Utils.jsonToResponse({
    success: true,
    message: "成功更新文件索引",
    payload: {
      count: allFiles.length,
    },
  });
};

// 不指定 delimiter, B2 的 API 不会返回文件夹
const b2_list_file_names_FileSchema_NoFolder = z.object({
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
const b2_list_file_names_Schema_NoFolder = z.object({
  files: b2_list_file_names_FileSchema_NoFolder.array(),
  nextFileName: z.string().nullish(),
});
type b2_list_file_names_File = z.infer<typeof b2_list_file_names_FileSchema_NoFolder>;

async function getAllFiles_b2_list_file_names(bucketId: string, apiUrl: string, authorizationToken: string) {
  let allFiles = [];
  let nfn: string | null | undefined = "";
  while (typeof nfn === "string") {
    const search =
      nfn === ""
        ? new URLSearchParams({
            bucketId,
            maxFileCount: "1000",
          })
        : new URLSearchParams({
            bucketId,
            maxFileCount: "1000",
            startFileName: nfn,
          });

    const data = b2_list_file_names_Schema_NoFolder.parse(
      await (
        await fetch(`${apiUrl}/b2api/v2/b2_list_file_names?${search}`, {
          headers: {
            Authorization: authorizationToken,
          },
        })
      ).json(),
    );
    nfn = data.nextFileName;
    allFiles.push(...data.files);
  }
  return allFiles;
}

function filesToTree(files: b2_list_file_names_File[]) {
  const tree: TreeNode = {
    isFolder: true,
    name: "root",
    nodes: [],
  };
  files.forEach((file) => {
    let current = tree;
    const segments = file.fileName.split("/");
    segments.slice(0, -1).forEach((segment) => {
      current =
        (current.nodes.find((node) => node.isFolder && node.name === segment) as Extract<TreeNode, { isFolder: true }>) ||
        (current.nodes[
          current.nodes.push({
            isFolder: true,
            name: segment,
            nodes: [],
          }) - 1
        ] as Extract<TreeNode, { isFolder: true }>);
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
  return tree;
}

function sortTreeNode(node: TreeNode) {
  function sort(node: TreeNode) {
    if (node.isFolder) {
      node.nodes.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name, "zh");
      });
      node.nodes.forEach(sort);
    }
  }
  sort(node);
}
