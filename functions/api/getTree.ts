import { TreeNode, convertObjectToResponse, verifyJwt } from "../utils";
import {parse} from "cookie"

export const onRequestGet: PagesFunction<{ BLAZEFLARE_KV: KVNamespace }> = async (context) => {
  const fullTree: TreeNode = JSON.parse(await context.env.BLAZEFLARE_KV.get("tree"));

  if (fullTree.isFolder===true) {
    const tree: TreeNode = {
      name: "root",
      isFolder: true,
      nodes: [fullTree.nodes.find(node=>node.name==="everyone")]
    }

    const cookie = parse(context.request.headers.get("Cookie")||"")
    if (cookie.id_token!==undefined) {
      const {payload} = await verifyJwt(cookie.id_token);
      tree.nodes.push(fullTree.nodes.find(node=>node.name===payload.nickname))
    }

    return convertObjectToResponse(tree)
  }

  return new Response("未建立文件树")
};
