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
import { sharedMeta } from "~/routes/_homepage/route";
import { assertItemFound } from "~/utils";

export const loader = async ({
  request,
  params: { notionDrivenPage: requestedNotionDrivenPageSlug = "" },
}: LoaderArgs) => {
  const page = (await getNotionDrivenPages(request)).find(
    findPageBySlugPredicate(requestedNotionDrivenPageSlug),
  );
  assertItemFound(page);

  const blocks = await getBlocksWithChildren(page.id);
  prepareSkipKladdBlocks(blocks);
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

export default function Component() {
  const data = useLoaderData<typeof loader>();
  return (
    <HorizontalLayout className={commonTailwindStyles.prose}>
      <NotionRender
        components={notionRenderComponents}
        classes={notionRenderClasses}
        blocks={data.blocks}
      />
      <Debug debugData={data.debugData} />
    </HorizontalLayout>
  );
}

export const commonTailwindStyles = /*tw*/ {
  prose: "prose prose-slate !prose-invert [&_figure_pre]:mb-0 max-w-full",
};

export const HorizontalLayout = ({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) => {
  return (
    <div className={`mx-[5vw] mt-4 ${className}`}>
      <div className="mx-auto">{children}</div>
    </div>
  );
};

/**
 * Skip notion heading blocks with the text Kladd
 */
export const prepareSkipKladdBlocks = (blocks: Block[]) => {
  const headingBlockTypes: Block["type"][] = [
    "heading_1",
    "heading_2",
    "heading_3",
  ];

  // Iterate in reverse order in order to be able to
  // remove the array as we go through
  for (let i = blocks.length - 1; i >= 0; i -= 1) {
    const block = blocks[i];
    if (
      headingBlockTypes.includes(block.type) &&
      getTextFromRichText((block as any)[block.type].rich_text) === "Kladd"
    ) {
      blocks.splice(i, 1);
    }
  }
};
