import config from "~/config.server";
import { takeWhileM } from "~/utils";
import type { Block, RichTextItem } from "./notion.types";
import type { DatabasePage, PageResponse } from "./notion-api.server";
import { getDatabase, getDatabasePages } from "./notion-api.server";

export function slugify(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// Notion/Domain helpers
export const getTitle = (fromPage: PageResponse | DatabasePage) => {
  const title = Object.values(fromPage.properties).find(
    (property) => property.type === "title",
  );
  if (title?.type !== "title")
    throw new Error("Could not get title from passed notion page");
  return title.title[0].plain_text;
};
export const getText = (name: string, fromPage: DatabasePage) => {
  const property = fromPage.properties[name];
  if (property?.type === "rich_text") {
    return getTextFromRichText(property.rich_text);
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
export const getSelectAndColor = (name: string, fromPage: DatabasePage) => {
  const property = fromPage.properties[name];
  if (
    property?.type === "select" &&
    property.select?.name &&
    property.select.color
  ) {
    return {
      title: property.select.name,
      color: property.select.color,
    } as const;
  }
  return undefined;
};

export const getMultiSelect = (name: string, fromPage: DatabasePage) => {
  const property = fromPage.properties[name];
  if (property?.type === "multi_select") {
    return property.multi_select.map((x) => x.name);
  }
  return undefined;
};

export const getTextFromRichText = (richText: RichTextItem[]) =>
  richText.map((richTextBlock) => richTextBlock.plain_text).join("");

export const findPageBySlugPredicate =
  (slug: string) => (page: PageResponse | DatabasePage) =>
    slugify(getTitle(page)) === slug;

export const getDrinkerDatabase = async () =>
  await getDatabase(config.drinkerDatabaseId);

export const getDrinker = async () =>
  await getDatabasePages(
    config.drinkerDatabaseId,
    [{ timestamp: "created_time", direction: "ascending" }],
    {
      property: "Gruppering",
      multi_select: {
        contains: "🌐",
      },
    },
  );

export const getPresentasjoner = async () =>
  (
    await getDatabasePages(config.presentasjonerDatabaseId, [
      { timestamp: "created_time", direction: "ascending" },
    ])
  ).filter(filterPublishedPredicate);

export const getNotionDrivenPages = async () =>
  (await getDatabasePages(config.notionDrivenPagesDatabaseId)).filter(
    filterPublishedPredicate,
  );

export const getTodayILearnedEntries = async () =>
  await getDatabasePages(config.todayILearnedDatabaseId);

// ENV stuff
type PublishedEnv = "PUBLISHED" | "DEV" | "UNPUBLISHED";
const getPublisedProperty = (fromPage: DatabasePage): PublishedEnv => {
  const property = getSelect("Published", fromPage);
  if (property === "PUBLISHED") return property;
  if (property === "DEV") return property;
  if (property === "UNPUBLISHED") return property;

  // Default
  return "PUBLISHED";
};
const getEnv = () => {
  if (process.env.NODE_ENV === "production") return "PROD";
  else if (process.env.NODE_ENV === "development") return "DEV";
};
export const filterPublishedPredicate = (page: DatabasePage) => {
  const published = getPublisedProperty(page);
  if (getEnv() === "PROD") return published === "PUBLISHED";
  if (getEnv() === "DEV")
    return published === "PUBLISHED" || published === "DEV";
  return false;
};

// Utils
export const takeBlocksAfterHeader = (header: string, blocks: Block[]) => {
  const headingBlockTypes: Block["type"][] = [
    "heading_1",
    "heading_2",
    "heading_3",
  ];
  const blocksCopy = blocks.slice();
  const remainingBlocks: Block[] = [];
  let takenBlocks: Block[] = [];
  let block: Block | undefined;
  while ((block = blocksCopy.shift()) !== undefined) {
    if (
      headingBlockTypes.includes(block.type) &&
      getTextFromRichText((block as any)[block.type].rich_text).includes(header)
    ) {
      takenBlocks = takeWhileM(
        blocksCopy,
        (x) => !headingBlockTypes.includes(x.type),
      );
    } else {
      remainingBlocks.push(block);
    }
  }

  return [takenBlocks, remainingBlocks];
};
