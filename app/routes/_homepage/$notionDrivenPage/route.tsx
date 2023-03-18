import type {
  HeadersFunction,
  LoaderArgs,
  V2_MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import Debug from "~/components/debug";
import { maybePrepareDebugData } from "~/components/debug.server";
import {
  notionRenderClasses,
  notionRenderComponents,
} from "~/components/notion-render-config";
import config from "~/config";
import {
  findPageBySlugPredicate,
  getNotionDrivenPages,
  getTextFromRichText,
  getTitle,
} from "~/notion/notion";
import type { Block } from "~/notion/notion.types";
import { getBlocksWithChildren } from "~/notion/notion-api.server";
import NotionRender from "~/packages/notion-render";
import { prepareNotionBlocksWithShiki } from "~/packages/notion-shiki-code/prepare.server";
import { assertItemFound } from "~/utils";
import { sharedMeta } from "../route";

/**
 * Skip notion heading blocks with the text Kladd
 */
const skipKladdNotionBlocks = (blocks: Block[]) =>
  blocks.filter((block) => {
    const headingBlockTypes: Block["type"][] = [
      "heading_1",
      "heading_2",
      "heading_3",
    ];
    return !(
      headingBlockTypes.includes(block.type) &&
      getTextFromRichText((block as any)[block.type].rich_text) === "Kladd"
    );
  });

export const loader = async ({
  request,
  params: { notionDrivenPage: requestedNotionDrivenPageSlug = "" },
}: LoaderArgs) => {
  const page = (await getNotionDrivenPages(request)).find(
    findPageBySlugPredicate(requestedNotionDrivenPageSlug),
  );
  assertItemFound(page);

  // Get current page blocks
  let blocks = await getBlocksWithChildren(page.id);
  blocks = skipKladdNotionBlocks(blocks);
  await prepareNotionBlocksWithShiki(blocks, { theme: "dark-plus" });

  return json(
    {
      page,
      blocks,
      debugData: await maybePrepareDebugData(request, { page, blocks }),
    },
    { headers: config.cacheControlHeadersDynamic(page.last_edited_time) },
  );
};
export const headers: HeadersFunction = ({ loaderHeaders }) => loaderHeaders;

export const meta: V2_MetaFunction<typeof loader> = ({ data }) => [
  ...sharedMeta,
  {
    title: getTitle(data.page),
  },
];

export default function NotionDrivenPage() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <div className="prose !prose-invert prose-slate max-w-full">
        <NotionRender
          components={notionRenderComponents}
          classes={notionRenderClasses}
          blocks={data.blocks}
        />
      </div>
      <Debug debugData={data.debugData} />
    </>
  );
}
