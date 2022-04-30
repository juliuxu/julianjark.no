import {
  HeadersFunction,
  json,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  getTitle,
  findPageBySlugPredicate,
  getNotionDrivenPages,
} from "~/service/notion";
import {
  getBlocksWithChildren,
  PageResponse,
} from "~/service/notionApi.server";
import { assertItemFound } from "~/common";
import Debug from "~/components/debug";
import NotionRender from "~/packages/notion-render";
import { Block } from "~/service/notion.types";
import type { Classes as NotionRenderClasses } from "~/packages/notion-render/classes";
import type { Components as NotionRenderComponents } from "~/packages/notion-render/components";
import {
  ShikiNotionCode,
  prepareNotionBlocks,
} from "~/shiki-code-render/shiki-notion";
import PrismCode from "~/components/prismCode";
import { getPlainTextFromRichTextList } from "~/packages/notion-render/components";
import config from "~/config.server";
import { OptimizedNotionImage } from "~/components/notionComponents";

export const PrismNotionCode: NotionRenderComponents["code"] = ({ block }) => {
  if (block.type !== "code") return null;
  return (
    <PrismCode
      language={block.code.language}
      code={getPlainTextFromRichTextList(block.code.rich_text)}
    />
  );
};

// Notion Render Settings
export const notionRenderClasses: Partial<NotionRenderClasses> = {
  column_list: { root: "grid" },
  color_blue: "color_blue",
  color_green: "color_green",
  color_orange: "color_orange",
};
export const notionRenderComponents: Partial<NotionRenderComponents> = {
  // code: PrismNotionCode,
  code: ShikiNotionCode,
  image: OptimizedNotionImage,
};

type Data = { page: PageResponse; blocks: Block[] };
export const loader: LoaderFunction = async ({
  params: { notionDrivenPage: requestedNotionDrivenPageSlug = "" },
}) => {
  const page = (await getNotionDrivenPages()).find(
    findPageBySlugPredicate(requestedNotionDrivenPageSlug)
  );
  assertItemFound(page);

  // Get current page blocks
  const blocks = await getBlocksWithChildren(page.id);
  await prepareNotionBlocks(blocks, { theme: "dark-plus" });

  return json<Data>(
    {
      page,
      blocks,
    },
    { headers: config.cacheControlHeaders }
  );
};
export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return loaderHeaders;
};

export const meta: MetaFunction = ({ data }: { data: Data }) => {
  return {
    title: getTitle(data.page),
  };
};

export default function NotionDrivenPage() {
  const data = useLoaderData<Data>();
  return (
    <>
      <NotionRender
        components={notionRenderComponents}
        classes={notionRenderClasses}
        blocks={data.blocks}
      />
      <Debug pageData={data} />
    </>
  );
}
