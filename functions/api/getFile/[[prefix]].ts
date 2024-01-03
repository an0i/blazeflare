import { z } from "zod";
import { parse } from "cookie";
import { verifyJwt, fetchFile } from "../../utils";

export const onRequestGet: PagesFunction<{ BLAZEFLARE_KV: KVNamespace }> = async (context) => {
  const segments = decodeURIComponent(z.string().min(1).array().min(2).parse(context.params.prefix).join("/")).split("/");

  if (segments[0] === "everyone") {
    return fetchFile(context.env.BLAZEFLARE_KV, segments);
  } else {
    const cookie = parse(context.request.headers.get("Cookie")||"");

    if (cookie.id_token !== undefined) {
      try {
        const { payload } = await verifyJwt(cookie.id_token);
        if (segments[0] === payload.sub) {
          return fetchFile(context.env.BLAZEFLARE_KV, segments);
        }
      } catch (error) {
        return new Response("无权限", { status: 401, statusText: "Unauthorized" });
      }
    }
    return new Response("无权限", { status: 401, statusText: "Unauthorized" });
  }
};
