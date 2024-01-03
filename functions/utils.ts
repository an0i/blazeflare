import { z } from "zod";
import * as jose from "jose";

export type TreeNode =
  | {
      isFolder: true;
      name: string;
      nodes: TreeNode[];
    }
  | { isFolder: false; name: string; id: string; birth: number; size: number; mime: string; sha1?: string | null; md5?: string | null };

export function convertObjectToResponse(obj: Object) {
  return new Response(JSON.stringify(obj), {
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
  });
}

export async function getB2AuthorizeAccount(id: string, key: string) {
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

  return b2AuthorizeAccountSchema.parse(
    await (
      await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
        headers: {
          Authorization: `Basic ${btoa(id + ":" + key)}`,
        },
      })
    ).json(),
  );
}

export function fetchB2DownloadFileById(authorizationToken: string, fileId: string, apiUrl: string) {
  return fetch(`${apiUrl}/b2api/v2/b2_download_file_by_id?fileId=${fileId}`, {
    headers: {
      Authorization: authorizationToken,
    },
  });
}

export async function getConfigFromKv(kv: KVNamespace) {
  return z
    .object({
      id: z.string(),
      key: z.string(),
    })
    .parse(JSON.parse(await kv.get("config")));
}

export async function fetchFile(kv: KVNamespace, segments: string[]) {
  const tree: TreeNode = JSON.parse(await kv.get("tree"));

  let current = tree;
  for (let i = 0; i <= segments.length - 1; ++i) {
    if (current.isFolder) {
      const finded = current.nodes.find((node) => (i === segments.length - 1 ? !node.isFolder : node.isFolder) && node.name === segments[i]);
      if (finded === undefined) break;
      current = finded;
    }
  }

  if (current.isFolder === false) {
    const { id, key } = await getConfigFromKv(kv);
    const { apiUrl, authorizationToken } = await getB2AuthorizeAccount(id, key);
    return await fetchB2DownloadFileById(authorizationToken, current.id, apiUrl);
  }

  return convertObjectToResponse({ success: false, message: "文件树中找不到该文件" });
}

export async function verifyJwt(jwt: string) {
  const JWKS = jose.createRemoteJWKSet(new URL("https://an0iauth0.us.auth0.com/.well-known/jwks.json"));

  return await jose.jwtVerify(jwt, JWKS, {
    issuer: "https://an0iauth0.us.auth0.com/",
    audience: "4QZZE81TKbdgTdmCOWZZQWnBZj4mZjH0",
  });
}
