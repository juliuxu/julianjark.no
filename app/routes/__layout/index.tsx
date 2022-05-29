import {
  HeadersFunction,
  json,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Debug from "~/components/debug";
import config from "~/config.server";
import NotionRender from "~/packages/notion-render";
import { Block } from "~/notion/notion.types";
import { getBlocksWithChildren } from "~/notion/notion-api.server";
import {
  notionRenderClasses,
  notionRenderComponents,
} from "./$notionDrivenPage";
import { prepareNotionBlocks } from "~/packages/notion-shiki-code/prepare.server";
import { maybePrepareDebugData } from "~/components/debug.server";

type Data = { blocks: Block[]; debugData?: string };
export const loader: LoaderFunction = async ({ request }) => {
  const blocks = await getBlocksWithChildren(config.forsidePageId);
  await prepareNotionBlocks(blocks, { theme: "dark-plus" });
  return json<Data>(
    {
      blocks,
      debugData: await maybePrepareDebugData(request, blocks),
    },
    { headers: config.cacheControlHeaders }
  );
};
export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return loaderHeaders;
};

export const meta: MetaFunction = () => ({
  title: "Julian Jark",
});

export default function Index() {
  const data = useLoaderData<Data>();
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
