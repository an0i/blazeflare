import { z } from "zod";
import { convertObjectToResponse, getB2AuthorizeAccount } from "../utils";

const postConfigRequestJsonSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
});

export const onRequestPost: PagesFunction<{ BLAZEFLARE_KV: KVNamespace }> = async (context) => {
  const { id, key } = postConfigRequestJsonSchema.parse(await context.request.json());

  const {
    allowed: { bucketId },
  } = await getB2AuthorizeAccount(id, key);

  if (typeof bucketId !== "string")
    return convertObjectToResponse({
      success: false,
      message: "需要单一储存桶权限的密钥",
    });

  await context.env.BLAZEFLARE_KV.put("config", JSON.stringify({ id, key }));

  return convertObjectToResponse({
    success: true,
    message: "已设置",
    payload: { id },
  });
};
