import { string, z } from "zod";
import * as jose from "jose";

const config = {
  jwks: "https://an0iauth0.us.auth0.com/.well-known/jwks.json",
  issuer: "https://an0iauth0.us.auth0.com/",
  audience: "4QZZE81TKbdgTdmCOWZZQWnBZj4mZjH0",
  kvEnvName: "BLAZEFLARE_KV",
  idEnvName: "B2_APP_ID",
  keyEnvName: "B2_APP_KEY",
};

export type TreeNode = { isFolder: true; name: string; nodes: TreeNode[] } | { isFolder: false; name: string; id: string; birth: number; size: number; mime: string; sha1?: string | null; md5?: string | null };

export class Utils {
  static jsonToResponse(body: string | object) {
    const headers = { "Content-Type": "application/json;charset=utf-8" };
    if (typeof body === "string") return new Response(body, { headers });
    return new Response(JSON.stringify(body), { headers });
  }
  static async verifyJwt(token: string) {
    const JWKS = jose.createRemoteJWKSet(new URL(config.jwks));
    return await jose.jwtVerify(token, JWKS, { issuer: config.issuer, audience: config.audience });
  }
  static getIdKey(context: any): Record<string, string> {
    const id = context.env[config.idEnvName];
    const key = context.env[config.keyEnvName];
    if (typeof id !== "string" || typeof key !== "string") throw new Error("未配置密钥环境变量");
    return { id, key };
  }
  static async getTreeFromKv(kv: KVNamespace) {
    const value = await kv.get("tree");
    if (value === null) throw new Error("没有文件树");
    const tree: TreeNode = JSON.parse(value);
    if (!tree?.isFolder) throw new Error("文件树无效");
    return tree;
  }
  static async get_b2_authorize_account(context: any) {
    const b2AuthorizeAccountSchema = z.object({
      accountId: z.string(),
      authorizationToken: z.string(),
      allowed: z.object({
        capabilities: z.string().array(),
        bucketId: z.string().nullish(),
        bucketName: z.string().nullish(),
        namePrefix: z.string().nullish(),
      }),
      apiUrl: z.string(),
      downloadUrl: z.string(),
      recommendedPartSize: z.number(),
      absoluteMinimumPartSize: z.number(),
      s3ApiUrl: z.string(),
    });

    const { id, key } = Utils.getIdKey(context);
    const data = b2AuthorizeAccountSchema.parse(
      await (
        await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
          headers: {
            Authorization: `Basic ${btoa(id + ":" + key)}`,
          },
        })
      ).json(),
    );
    if (typeof data.allowed.bucketId !== "string") throw new Error("需要只有单一桶权限的应用密钥");
    return data as Extract<z.infer<typeof b2AuthorizeAccountSchema>, { allowed: { bucketId: string } }>;
  }
  static getKv(context: any): KVNamespace {
    return context.env[config.kvEnvName];
  }
}
