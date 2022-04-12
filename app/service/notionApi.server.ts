import { Client } from "@notionhq/client";
import type { ListBlockChildrenResponse } from "@notionhq/client/build/src/api-endpoints";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export const getDatabase = async (databaseId: string) => {
  const response = await notion.databases.query({
    database_id: databaseId,
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
  return blocks.filter(isBlockObjectResponse).map(fixRichTextToText);
};

export const getBlocksWithChildren = async (
  blockId: string
): Promise<BlockObjectResponseWithChildren[]> => {
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
  }) as BlockObjectResponseWithChildren[];

  return blocksWithChildren;
};

// Some typescript magic to extract the correct type
type Block = ListBlockChildrenResponse["results"][number];
const assertBlockObjectResponse = (block: Block) => {
  if ("type" in block) return block;
  throw new Error("passed block is not a BlockObjeectResponse");
};
type BlockObjectResponse = ReturnType<typeof assertBlockObjectResponse>;
function isBlockObjectResponse(block: Block): block is BlockObjectResponse {
  return "type" in block;
}

type BlockObjectResponseWithChildren = BlockObjectResponse & {
  children?: BlockObjectResponseWithChildren;
};

// Database
export type MaybeDatabasePageResponse = Awaited<
  ReturnType<typeof notion.databases.query>
>["results"][number];
export type DatabasePageResponse = ReturnType<typeof onlyDatabasePages>[number];
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

// Duplicate all `rich_text` keys with `text` to fix react-notion-renderer
// as it is not currently updated to the new format
const fixRichTextToText = (block: BlockObjectResponse) => {
  const innerBlock = block as Record<string, any>;
  return Object.keys(innerBlock).reduce((acc, key) => {
    const current = innerBlock[key];
    if (typeof current === "object" && "rich_text" in current) {
      acc[key] = { ...current, text: current["rich_text"] };
    } else {
      acc[key] = current;
    }
    return acc;
  }, {} as Record<string, any>) as BlockObjectResponse;
};
