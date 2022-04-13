import config from "~/config.server";
import {
  DatabasePage,
  getBlocksWithChildren,
  getDatabasePages,
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
export const getTitle = (fromPage: PageResponse | DatabasePage) => {
  const title = Object.values(fromPage.properties).find(
    (property) => property.type === "title"
  );
  if (title?.type !== "title")
    throw new Error("Could not get title from passed notion page");
  return title.title[0].plain_text;
};
export const getText = (name: string, fromPage: DatabasePage) => {
  const property = fromPage.properties[name];
  if (property?.type === "rich_text") {
    return property.rich_text
      .map((richTextBlock) => richTextBlock.plain_text)
      .join("");
  }
  return undefined;
};
export const getCheckbox = (name: string, fromPage: DatabasePage) => {
  const property = fromPage.properties[name];
  if (property?.type === "checkbox") {
    return property.checkbox;
  }
  return undefined;
};
export const getSelect = (name: string, fromPage: DatabasePage) => {
  const property = fromPage.properties[name];
  if (property?.type === "select") {
    return property.select?.name;
  }
  return undefined;
};

export const findPageBySlugPredicate =
  (slug: string) => (page: PageResponse | DatabasePage) =>
    slugify(getTitle(page)) === slug;

// Async
export const getLandingPage = memoAsync(
  "landingPage",
  async () => await getBlocksWithChildren(config.landingPageId)
);

export const getNotionDrivenPages = memoAsync(
  "notionDrivenPages",
  async () => await getDatabasePages(config.notionDrivenPagesDatabaseId)
);

export const getPresentasjoner = memoAsync(
  "presentasjoner",
  async () =>
    await getDatabasePages(config.presentasjonerDatabaseId, [
      { timestamp: "created_time", direction: "ascending" },
    ])
);

// Util
// Simple memo for async functions
// TODO: This might be a bit hacky and cause problems
function memoAsync<T>(name: string, fn: () => Promise<T>): () => Promise<T> {
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
