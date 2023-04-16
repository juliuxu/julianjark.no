import { Client } from "@notionhq/client";
import type { ListBlockChildrenResponse } from "@notionhq/client/build/src/api-endpoints";
import { LRUCache } from "lru-cache";
import type { MemoizerOptions } from "memoize-fs";
import memoizeFs from "memoize-fs";
import { join as pathJoin } from "path";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

type Sorts = Parameters<typeof notion.databases.query>[0]["sorts"];
type Filter = Parameters<typeof notion.databases.query>[0]["filter"];

export let getDatabasePages = async (
  databaseId: string,
  sorts?: Sorts,
  filter?: Filter,
) => {
  const response = await notion.databases.query({
    database_id: databaseId,
    sorts,
    filter,
  });

  return onlyDatabasePages(response.results);
};

export let getPage = async (pageId: string) => {
  const response = await notion.pages.retrieve({ page_id: pageId });
  return assertPageResponse(response);
};

export let getDatabase = async (databaseId: string) => {
  const response = await notion.databases.retrieve({ database_id: databaseId });
  return assertDatabaseResponse(response);
};

export let getBlocks = async (blockId: string) => {
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

export let getBlocksWithChildren = async (
  blockId: string,
): Promise<BlockWithChildren[]> => {
  const blocks = await getBlocksNoCache(blockId);
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
      }),
  );

  const blocksWithChildren = blocks.map((block) => {
    const innerBlock = block as Record<string, any>;
    // Add child blocks if the block should contain children but none exists
    if (innerBlock.has_children && !innerBlock[innerBlock.type].children) {
      innerBlock[innerBlock.type]["children"] = childBlocks.find(
        (x) => x.id === innerBlock.id,
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

// Database
export type MaybeDatabaseResponse = Awaited<
  ReturnType<typeof notion.databases.retrieve>
>;
export type DatabaseResponse = ReturnType<typeof assertDatabaseResponse>;
const assertDatabaseResponse = (page: MaybeDatabaseResponse) => {
  if ("properties" in page) return page;
  throw new Error("passed page is not a DatabaseResponse");
};

// Non-cached
export const getPageNoCache = getPage;
export const getDatabaseNoCache = getDatabase;
export const getBlocksNoCache = getBlocks;
export const getDatabasePagesNoCache = getDatabasePages;
export const getBlocksWithChildrenNoCache = getBlocksWithChildren;

/**
 * Caching
 *
 * notion api is not super fast.
 * by caching in memory during production we speed up requests using the same notion data
 * by caching on file system during development we speed up page reloads during code changes
 */
export let notionCachePurgeEverything = async () => {};
if (process.env.NODE_ENV === "production") {
  const inMemoryCache = new LRUCache({ max: 500, ttl: 1000 * 60 });
  const inMemoryMemo = (fn: (...args: any[]) => Promise<any>) => {
    return async (...args: any) => {
      const key = fn.name + JSON.stringify(args);
      const cached = inMemoryCache.get(key);
      if (cached) return cached;

      const fresh = await fn(...args);
      inMemoryCache.set(key, fresh);
      return fresh;
    };
  };
  notionCachePurgeEverything = async () => inMemoryCache.clear();

  getPage = inMemoryMemo(getPage);
  getDatabase = inMemoryMemo(getDatabase);
  getBlocks = inMemoryMemo(getBlocks);
  getBlocksWithChildren = inMemoryMemo(getBlocksWithChildren);
  getDatabasePages = inMemoryMemo(getDatabasePages);
}

if (process.env.NODE_ENV === "development") {
  const cachePath = pathJoin(".cache", "notion-api-cache");
  console.log("caching notion to", cachePath);
  const memoizer = memoizeFs({
    cachePath,
  });
  const memoFsAsync = (
    fn: (...args: never) => unknown,
    memoizerOptions: Partial<MemoizerOptions> = {},
  ) => {
    const p = memoizer.fn(fn, memoizerOptions);
    let mfn: any = undefined;
    return async (...args: any) => {
      if (!mfn) {
        mfn = await p;
      }
      return await mfn(...args);
    };
  };
  notionCachePurgeEverything = memoizer.invalidate;

  getPage = memoFsAsync(getPage);
  getDatabase = memoFsAsync(getDatabase);
  getBlocks = memoFsAsync(getBlocks);
  getBlocksWithChildren = memoFsAsync(getBlocksWithChildren);
  getDatabasePages = memoFsAsync(getDatabasePages);
}
