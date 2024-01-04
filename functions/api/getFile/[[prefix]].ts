import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { TreeNode, Utils } from "../../utils";

export const onRequestGet: PagesFunction = async (context) => {
  const filePathSegments = decodeURIComponent(z.string().min(1).array().min(2).parse(context.params.prefix).join("/")).split("/");

  // 若非 everyone
  if (filePathSegments[0] !== "everyone") {
    const cookie = parseCookie(context.request.headers.get("Cookie") || "");
    // 1. 无 Cookie
    if (cookie.id_token === undefined) throw new Error("无权限");
    // 2. Token 无效
    const { payload } = await Utils.verifyJwt(cookie.id_token);
    // 3. Token 不对应
    if (filePathSegments[0] !== payload.nickname) throw new Error("无权限");
  }

  return await fetchFile(context, filePathSegments);
};

async function fetchFile(context: any, filePathSegments: any) {
  const tree = await Utils.getTreeFromKv(Utils.getKv(context));
  const file = searchFileAtTreeBySegments(tree, filePathSegments);
  const { authorizationToken, apiUrl } = await Utils.get_b2_authorize_account(context);
  return await fetch_b2_download_file_by_id(file.id, authorizationToken, apiUrl);
}

function fetch_b2_download_file_by_id(fileId: string, authorizationToken: string, apiUrl: string) {
  return fetch(`${apiUrl}/b2api/v2/b2_download_file_by_id?fileId=${fileId}`, {
    headers: {
      Authorization: authorizationToken,
    },
  });
}

function searchFileAtTreeBySegments(tree: TreeNode, segments: string[]) {
  let current = tree;
  if (!current?.isFolder) throw new Error("错误的文件树");
  for (let i = 0; i <= segments.length - 2; ++i) {
    const finded = current.nodes.find((node) => node.isFolder && node.name === segments[i]) as Extract<TreeNode, { isFolder: true }> | undefined;
    if (finded === undefined) throw new Error("找不到");
    current = finded;
  }
  const finded = current.nodes.find((node) => node.isFolder === false && node.name === segments[segments.length - 1]) as Extract<TreeNode, { isFolder: false }> | undefined;
  if (finded === undefined) throw new Error("找不到");
  return finded;
}
