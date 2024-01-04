import { TreeNode, Utils } from "../utils";
import { parse as parseCookie } from "cookie";

export const onRequestGet: PagesFunction = async (context) => {
  const fullTree = await Utils.getTreeFromKv(Utils.getKv(context));
  const resultTree: TreeNode = {
    name: "root",
    isFolder: true,
    nodes: [],
  };

  // 添加 everyoneFolder
  const everyoneFolder = fullTree.nodes.find((node) => node.name === "everyone");
  everyoneFolder !== undefined && resultTree.nodes.push(everyoneFolder);

  // 鉴权添加 userFolder
  const cookie = parseCookie(context.request.headers.get("Cookie") || "");
  if (cookie.id_token !== undefined) {
    const { payload } = await Utils.verifyJwt(cookie.id_token);
    const userFolder = fullTree.nodes.find((node) => node.name === payload.nickname);
    userFolder !== undefined && resultTree.nodes.push(userFolder);
  }

  return Utils.jsonToResponse(resultTree);
};
