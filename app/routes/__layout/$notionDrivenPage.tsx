import type {
  HeadersFunction,
  LoaderArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import Debug from "~/components/debug";
import { maybePrepareDebugData } from "~/components/debug.server";
import { OptimizedNotionImage } from "~/components/notion-components";
import config from "~/config.server";
import {
  findPageBySlugPredicate,
  getNotionDrivenPages,
  getTitle,
} from "~/notion/notion";
import { getBlocksWithChildren } from "~/notion/notion-api.server";
import NotionRender from "~/packages/notion-render";
import type { Classes as NotionRenderClasses } from "~/packages/notion-render/classes";
import type { Components as NotionRenderComponents } from "~/packages/notion-render/components";
import { prepareNotionBlocks } from "~/packages/notion-shiki-code/prepare.server";
import { ShikiNotionCode } from "~/packages/notion-shiki-code/shiki-notion";
import { assertItemFound } from "~/utils";

// Notion Render Settings
export const notionRenderClasses: Partial<NotionRenderClasses> = {
  column_list: { root: "grid" },
  image: { root: "notion-image" },

  color_default: "color_default",
  color_gray: "color_gray",
  color_brown: "color_brown",
  color_orange: "color_orange",
  color_yellow: "color_yellow",
  color_green: "color_green",
  color_blue: "color_blue",
  color_purple: "color_purple",
  color_pink: "color_pink",
  color_red: "color_red",
  color_gray_background: "color_gray_background",
  color_brown_background: "color_brown_background",
  color_orange_background: "color_orange_background",
  color_yellow_background: "color_yellow_background",
  color_green_background: "color_green_background",
  color_blue_background: "color_blue_background",
  color_purple_background: "color_purple_background",
  color_pink_background: "color_pink_background",
  color_red_background: "color_red_background",
};
export const notionRenderComponents: Partial<NotionRenderComponents> = {
  code: ShikiNotionCode,
  image: OptimizedNotionImage,
};

export const loader = async ({
  request,
  params: { notionDrivenPage: requestedNotionDrivenPageSlug = "" },
}: LoaderArgs) => {
  const page = (await getNotionDrivenPages()).find(
    findPageBySlugPredicate(requestedNotionDrivenPageSlug),
  );
  assertItemFound(page);

  // Get current page blocks
  const blocks = await getBlocksWithChildren(page.id);
  await prepareNotionBlocks(blocks, { theme: "dark-plus" });

  return json(
    {
      page,
      blocks,
      debugData: await maybePrepareDebugData(request, { page, blocks }),
    },
    { headers: config.cacheControlHeadersDynamic(page.last_edited_time) },
  );
};
export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return loaderHeaders;
};

export const meta: MetaFunction = ({ data }) => {
  return {
    title: getTitle(data.page),
  };
};

export default function NotionDrivenPage() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <NotionRender
        components={notionRenderComponents}
        classes={notionRenderClasses}
        blocks={data.blocks}
      />
      <Debug debugData={data.debugData} />
    </>
  );
}
