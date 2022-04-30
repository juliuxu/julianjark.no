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
import { Block } from "~/service/notion.types";
import { getBlocksWithChildren } from "~/service/notionApi.server";
import { prepareNotionBlocks } from "~/shiki-code-render/shiki-notion";
import {
  notionRenderClasses,
  notionRenderComponents,
} from "./$notionDrivenPage";

type Data = { blocks: Block[] };
export const loader: LoaderFunction = async () => {
  const blocks = await getBlocksWithChildren(config.landingPageId);
  await prepareNotionBlocks(blocks, { theme: "dark-plus" });
  return json<Data>(
    {
      blocks,
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
      <Debug pageData={data.blocks} />
    </>
  );
}
