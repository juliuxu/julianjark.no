import { Render } from "@9gustin/react-notion-render";
import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { CollapsedCode } from "~/components/code";
import { getTitle, notionDrivenPages, slugify } from "~/service/notion";
import { getBlocksWithChildren } from "~/service/notionApi.server";

export const loader: LoaderFunction = async ({
  params: { notionDrivenPage: requestedNotionDrivenPageSlug },
}) => {
  const currentNotionPage = (await notionDrivenPages()).find(
    (notionDrivenPage) =>
      slugify(getTitle(notionDrivenPage)) === requestedNotionDrivenPageSlug
  );

  // 404 on MISS
  if (!currentNotionPage) {
    throw new Response("Not Found", {
      status: 404,
    });
  }

  // Get current page blocks
  const currentNotionPageBlocks = await getBlocksWithChildren(
    currentNotionPage.id
  );
  return json({
    currentNotionPage,
    currentNotionPageBlocks,
  });
};

export const meta: MetaFunction = ({ data }) => {
  return {
    title: getTitle(data.currentNotionPage),
  };
};

export default function NotionDrivenPage() {
  const data = useLoaderData();
  return (
    <main>
      <Render blocks={data.currentNotionPageBlocks} />
      <CollapsedCode language="json" code={JSON.stringify(data, null, 2)} />
    </main>
  );
}
