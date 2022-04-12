import config from "~/config.server";
import {
  DatabasePageResponse,
  getBlocksWithChildren,
  getDatabase,
  PageResponse,
} from "./notionApi.server";

export function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// Notion/Domain helpers
export const getTitle = (fromPage: PageResponse | DatabasePageResponse) => {
  const title = Object.values(fromPage.properties).find(
    (property) => property.type === "title"
  );
  if (title?.type !== "title")
    throw new Error("Could not get title from passed notion page");
  return title.title[0].plain_text;
};

export const notionDrivenPages = memoAsync(
  "notionDrivenPages",
  async () => await getDatabase(config.notionDrivenPagesDatabaseId)
);

export const landingPage = memoAsync(
  "landingPage",
  async () => await getBlocksWithChildren(config.landingPageId)
);

// Util
// Simple memo for async functions
// TODO: This might be a bit hacky and cause problems
function memoAsync<T>(name: string, fn: () => Promise<T>): () => Promise<T> {
  console.log("memoAsync called for ", name);
  let previousResult: Promise<T> | undefined;
  const resultFn = async () => {
    if (previousResult !== undefined) return previousResult;
    console.log("calling", name);
    const pendingResult = fn();
    previousResult = pendingResult;
    const finalResult = await pendingResult;
    previousResult = Promise.resolve(finalResult);

    return finalResult;
  };

  return resultFn;
}
