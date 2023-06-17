import config from "~/config";
import {
  assertContainsItems,
  flattenListDepthFirst,
  isDevMode,
  rewriteNotionImageUrl,
  takeWhileM,
} from "~/utils";
import type {
  Block,
  BlockWithChildren,
  RichTextColor,
  RichTextItem,
} from "./notion.types";
import type { DatabasePage, PageResponse } from "./notion-api.server";
import { getDatabase, getDatabasePages } from "./notion-api.server";

export function slugify(text: string) {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")

      // Norwegian æøå
      .replace("æ¨", "ae")
      .replace("ø", "o")
      .replace("å", "a")

      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "")
  );
}

// Notion/Domain helpers
export const getTitle = (fromPage: PageResponse | DatabasePage) => {
  const title = Object.values(fromPage.properties).find(
    (property) => property.type === "title",
  );
  if (title?.type !== "title")
    throw new Error("Could not get title from passed notion page");
  return title.title[0].plain_text.trim();
};
export const getFileUrl = (name: string, fromPage: DatabasePage) => {
  const property = fromPage.properties[name];
  if (property?.type === "files") {
    if (property.files.length === 0) return undefined;

    const file = property.files[0];
    if (file?.type === "external") {
      return file.external.url;
    } else if (file.type === "file") {
      return file.file.url;
    }
  }
  return undefined;
};
export const getRichText = (name: string, fromPage: DatabasePage) => {
  const property = fromPage.properties[name];
  if (property?.type === "rich_text") {
    return property.rich_text;
  }
  return undefined;
};
export const getText = (name: string, fromPage: DatabasePage) =>
  getTextFromRichText(getRichText(name, fromPage) ?? []);

export const getCheckbox = (name: string, fromPage: DatabasePage) => {
  const property = fromPage.properties[name];
  if (property?.type === "checkbox") {
    return property.checkbox;
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
export const getSelect = (name: string, fromPage: DatabasePage) =>
  getSelectAndColor(name, fromPage)?.title;

export const getMultiSelectAndColor = (
  name: string,
  fromPage: DatabasePage,
) => {
  const property = fromPage.properties[name];
  if (property?.type === "multi_select") {
    return property.multi_select.map((x) => ({
      title: x.name,
      color: x.color,
    }));
  }
  return undefined;
};
export const getMultiSelect = (name: string, fromPage: DatabasePage) =>
  getMultiSelectAndColor(name, fromPage)?.map((x) => x.title);

export const getTextFromRichText = (richText: RichTextItem[]) =>
  richText.map((richTextBlock) => richTextBlock.plain_text).join("");

export const findPageBySlugPredicate =
  (slug: string) => (page: PageResponse | DatabasePage) =>
    slugify(getTitle(page)) === slug;

type HeadingBlocks = Extract<
  Block,
  { type: "heading_1" | "heading_2" | "heading_3" }
>;
const headingBlockTypes: HeadingBlocks["type"][] = [
  "heading_1",
  "heading_2",
  "heading_3",
];

export const takeBlocksAfterHeader = (header: string, blocks: Block[]) => {
  const blocksCopy = blocks.slice();
  const remainingBlocks: Block[] = [];
  let takenBlocks: Block[] = [];
  let block: Block | undefined;
  while ((block = blocksCopy.shift()) !== undefined) {
    if (
      headingBlockTypes.includes(block.type as any) &&
      getTextFromRichText((block as any)[block.type].rich_text).includes(header)
    ) {
      takenBlocks = takeWhileM(
        blocksCopy,
        (x) => !headingBlockTypes.includes(x.type as any),
      );
    } else {
      remainingBlocks.push(block);
    }
  }

  return [takenBlocks, remainingBlocks];
};

export interface Heading {
  title: string;
  color: RichTextColor;
  subHeadings: Heading[];
}
export const getTableOfContents = (blocks: BlockWithChildren[]) => {
  const flatBlocks = flattenListDepthFirst(
    blocks as { children?: any }[],
  ) as Block[];
  const headingBlocks = flatBlocks.filter((x) =>
    headingBlockTypes.includes(x.type as any),
  ) as HeadingBlocks[];

  const result: Heading[] = [];

  let indents: Heading[][] = [result];
  for (const headingBlock of headingBlocks) {
    const heading: Heading = {
      color: (headingBlock as any)[headingBlock.type].color,
      title: getTextFromRichText(
        (headingBlock as any)[headingBlock.type].rich_text,
      ),
      subHeadings: [],
    };

    // Pop out to the proper indent
    if (headingBlock.type === "heading_1") indents = indents.slice(0, 1);
    if (headingBlock.type === "heading_2") indents = indents.slice(0, 2);
    if (headingBlock.type === "heading_3") indents = indents.slice(0, 3);

    // Push self into the correct parent
    indents[indents.length - 1].push(heading);

    // Increase indent
    indents.push(heading.subHeadings);
  }

  return result;
};

// Application specific
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

export const getPresentasjoner = async (request?: Request) =>
  (
    await getDatabasePages(config.presentasjonerDatabaseId, [
      { timestamp: "created_time", direction: "ascending" },
    ])
  ).filter(filterPublishedPredicate(request));

export const getNotionDrivenPages = async (request?: Request) =>
  (await getDatabasePages(config.notionDrivenPagesDatabaseId)).filter(
    filterPublishedPredicate(request),
  );

export const getTodayILearnedEntries = async (request?: Request) =>
  (await getDatabasePages(config.todayILearnedDatabaseId)).filter(
    filterPublishedPredicate(request),
  );

export const getBloggEntries = async (request?: Request) =>
  (await getDatabasePages(config.bloggDatabaseId)).filter(
    filterPublishedPredicate(request),
  );

// ENV stuff
type PublishedEnv = "PUBLISHED" | "DEV" | "DRAFT" | "UNPUBLISHED";
const getPublisedProperty = (fromPage: DatabasePage): PublishedEnv => {
  const property = getSelect("Published", fromPage);
  if (property === "PUBLISHED") return property;
  if (property === "DEV") return property;
  if (property === "DRAFT") return property;
  if (property === "UNPUBLISHED") return property;

  // Default
  return "UNPUBLISHED";
};

export const filterPublishedPredicate =
  (request?: Request) => (page: DatabasePage) => {
    const published = getPublisedProperty(page);
    if (isDevMode(request)) return ["PUBLISHED", "DEV"].includes(published);
    return published === "PUBLISHED";
  };

export interface ImageResource {
  src: string;
  alt: string;
}
export async function fetchDranksImageResources<T extends string>(
  names: T[],
): Promise<Record<T, ImageResource>> {
  const resources = await getDatabasePages(
    config.resurserDatabaseId,
    undefined,
    {
      or: names.map((name) => ({
        property: "Navn",
        title: {
          equals: name,
        },
      })),
    },
  );
  const images = resources.reduce((acc, x) => {
    const name = getTitle(x);
    const url = getFileUrl("Bilde", x);
    if (url === undefined)
      throw new Error(`no image resource for name ${name}`);
    const alt = getText("Alt", x);
    if (alt === undefined) throw new Error(`no alt for name ${name}`);
    acc[name] = { src: rewriteNotionImageUrl(url, x.id), alt };
    return acc;
  }, {} as Record<string, ImageResource>);
  assertContainsItems(names, images);

  return images;
}
