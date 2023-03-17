import type {
  HeadersFunction,
  LoaderArgs,
  MetaFunction,
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
  getTitle,
} from "~/notion/notion";
import { getBlocksWithChildren } from "~/notion/notion-api.server";
import NotionRender from "~/packages/notion-render";
import { prepareNotionBlocks } from "~/packages/notion-shiki-code/prepare.server";
import { assertItemFound } from "~/utils";

export const loader = async ({
  request,
  params: { notionDrivenPage: requestedNotionDrivenPageSlug = "" },
}: LoaderArgs) => {
  const page = (await getNotionDrivenPages(request)).find(
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
      <div className="prose prose-invert max-w-full">
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
