import { Client } from "@notionhq/client";
import type { ListBlockChildrenResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

type DatabaseSort =
  | {
      property: string;
      direction: "ascending" | "descending";
    }
  | {
      timestamp: "created_time" | "last_edited_time";
      direction: "ascending" | "descending";
    };
export const getDatabasePages = async (
  databaseId: string,
  sorts?: DatabaseSort[]
) => {
  const response = await notion.databases.query({
    database_id: databaseId,
    sorts,
  });

  return onlyDatabasePages(response.results);
};

export const getPage = async (pageId: string) => {
  const response = await notion.pages.retrieve({ page_id: pageId });
  return assertPageResponse(response);
};

export const getBlocks = async (blockId: string) => {
  const blocks = [];
  let cursor;
  while (true) {
    const { results, next_cursor } = (await notion.blocks.children.list({
      start_cursor: cursor,
      block_id: blockId,
    })) as ListBlockChildrenResponse;
    blocks.push(...results);
    if (!next_cursor) {
      break;
    }
    cursor = next_cursor;
  }
  return blocks.filter(isBlockObjectResponse);
};

export const getBlocksWithChildren = async (
  blockId: string
): Promise<BlockWithChildren[]> => {
  const blocks = await getBlocks(blockId);
  // Retrieve block children for nested blocks (one level deep), for example toggle blocks
  // https://developers.notion.com/docs/working-with-page-content#reading-nested-blocks
  const childBlocks = await Promise.all(
    blocks
      .filter((block) => block.has_children)
      .map(async (block) => {
        return {
          id: block.id,
          children: await getBlocksWithChildren(block.id),
        };
      })
  );

  const blocksWithChildren = blocks.map((block) => {
    const innerBlock = block as Record<string, any>;
    // Add child blocks if the block should contain children but none exists
    if (innerBlock.has_children && !innerBlock[innerBlock.type].children) {
      innerBlock[innerBlock.type]["children"] = childBlocks.find(
        (x) => x.id === innerBlock.id
      )?.children;
    }
    return innerBlock;
  }) as BlockWithChildren[];

  return blocksWithChildren;
};

// Some typescript magic to extract the correct type
type MaybeBlockResponse = ListBlockChildrenResponse["results"][number];
const assertBlockObjectResponse = (block: MaybeBlockResponse) => {
  if ("type" in block) return block;
  throw new Error("passed block is not a BlockObjeectResponse");
};
type Block = ReturnType<typeof assertBlockObjectResponse>;
function isBlockObjectResponse(block: MaybeBlockResponse): block is Block {
  return "type" in block;
}

type BlockWithChildren = Block & {
  children?: BlockWithChildren;
};

// Database
export type MaybeDatabasePageResponse = Awaited<
  ReturnType<typeof notion.databases.query>
>["results"][number];
export type DatabasePage = ReturnType<typeof onlyDatabasePages>[number];
const onlyDatabasePages = (databasePages: MaybeDatabasePageResponse[]) => {
  const result = [];
  for (let databasePage of databasePages) {
    if ("properties" in databasePage) {
      result.push(databasePage);
    }
  }
  return result;
};

// Page
export type MaybePageResponse = Awaited<
  ReturnType<typeof notion.pages.retrieve>
>;
export type PageResponse = ReturnType<typeof assertPageResponse>;
const assertPageResponse = (page: MaybePageResponse) => {
  if ("properties" in page) return page;
  throw new Error("passed page is not a PageResponse");
};
