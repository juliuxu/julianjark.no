import type { ListBlockChildrenResponse } from "@notionhq/client/build/src/api-endpoints";

// Some typescript magic to extract the correct type
type MaybeBlockResponse = ListBlockChildrenResponse["results"][number];
const assertBlockObjectResponse = (block: MaybeBlockResponse) => {
  if ("type" in block) return block;
  throw new Error("passed block is not a BlockObjeectResponse");
};
export type Block = ReturnType<typeof assertBlockObjectResponse>;

export type BlockWithChildren = Block & {
  children?: BlockWithChildren;
};
