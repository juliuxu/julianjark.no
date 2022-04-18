import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getTitle, findPageBySlugPredicate } from "~/service/notion";
import {
  getBlocksWithChildren,
  getDatabasePages,
  PageResponse,
} from "~/service/notionApi.server";
import { assertItemFound } from "~/common";
import Debug from "~/components/debug";
import NotionRender from "~/notion-render";
import { Block } from "~/service/notion.types";
import config from "~/config.server";
import { Classes as NotionRenderClasses } from "~/notion-render/classes";

// Notion Render Settings
export const myNotionRenderClasses: Partial<NotionRenderClasses> = {
  column_list: { root: "grid" },
  color_blue: "color_blue",
  color_green: "color_green",
  color_orange: "color_orange",
};

type Data = { page: PageResponse; blocks: Block[] };
export const loader: LoaderFunction = async ({
  params: { notionDrivenPage: requestedNotionDrivenPageSlug = "" },
}) => {
  const page = (
    await getDatabasePages(config.notionDrivenPagesDatabaseId)
  ).find(findPageBySlugPredicate(requestedNotionDrivenPageSlug));
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
      <NotionRender classes={myNotionRenderClasses} blocks={data.blocks} />
      <Debug pageData={data} />
    </>
  );
}
