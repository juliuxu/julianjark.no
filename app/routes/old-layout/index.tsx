import type {
  HeadersFunction,
  LoaderArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import Debug from "~/components/debug";
import { maybePrepareDebugData } from "~/components/debug.server";
import config from "~/config.server";
import { getBlocksWithChildren } from "~/notion/notion-api.server";
import NotionRender from "~/packages/notion-render";
import { prepareNotionBlocks } from "~/packages/notion-shiki-code/prepare.server";
import {
  notionRenderClasses,
  notionRenderComponents,
} from "./$notionDrivenPage";

export const loader = async ({ request }: LoaderArgs) => {
  const blocks = await getBlocksWithChildren(config.forsidePageId);
  await prepareNotionBlocks(blocks, { theme: "dark-plus" });
  return json(
    {
      blocks,
      debugData: await maybePrepareDebugData(request, blocks),
    },
    { headers: config.cacheControlHeaders },
  );
};
export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return loaderHeaders;
};

export const meta: MetaFunction = () => ({
  title: "Julian Jark",
});

export default function Index() {
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
