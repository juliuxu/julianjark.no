import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
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
import NotionRender from "~/notion-render";
import { Block } from "~/service/notion.types";
import type { Classes as NotionRenderClasses } from "~/notion-render/classes";
import type { Components as NotionRenderComponents } from "~/notion-render/components";
import { getPlainTextFromRichTextList } from "~/notion-render/components";
import Code from "~/components/prismCode";

// Notion Render Settings
export const notionRenderClasses: Partial<NotionRenderClasses> = {
  column_list: { root: "grid" },
  color_blue: "color_blue",
  color_green: "color_green",
  color_orange: "color_orange",
};
export const notionRenderComponents: Partial<NotionRenderComponents> = {
  code: ({ block }) => {
    if (block.type !== "code") return null;
    return (
      <Code
        language={block.code.language}
        code={getPlainTextFromRichTextList(block.code.rich_text)}
      />
    );
  },
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
  return json<Data>({
    page,
    blocks,
  });
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
