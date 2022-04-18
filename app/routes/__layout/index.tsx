import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Debug from "~/components/debug";
import config from "~/config.server";
import NotionRender from "~/notion-render";
import { Block } from "~/service/notion.types";
import { getBlocksWithChildren } from "~/service/notionApi.server";
import { myNotionRenderClasses } from "./$notionDrivenPage";

type Data = { blocks: Block[] };
export const loader: LoaderFunction = async () => {
  return json<Data>({
    blocks: await getBlocksWithChildren(config.landingPageId),
  });
};

export const meta: MetaFunction = () => ({
  title: "Julian Jark",
});

export default function Index() {
  const data = useLoaderData<Data>();
  return (
    <>
      <NotionRender classes={myNotionRenderClasses} blocks={data.blocks} />
      <Debug pageData={data.blocks} />
    </>
  );
}
