import {
  json,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import TopLevelMenu, {
  loader as topLevelMenuLoader,
} from "~/components/topLevelMenu";
import {
  getTitle,
  getNotionDrivenPages,
  findPageBySlugPredicate,
} from "~/service/notion";
import { getBlocksWithChildren } from "~/service/notionApi.server";
import { assertItemFound, commonLinks } from "~/common";
import Debug from "~/components/debug";
import NotionRender from "~/notion-render";

export const loader: LoaderFunction = async ({
  params: { notionDrivenPage: requestedNotionDrivenPageSlug = "" },
}) => {
  const currentNotionPage = (await getNotionDrivenPages()).find(
    findPageBySlugPredicate(requestedNotionDrivenPageSlug)
  );
  assertItemFound(currentNotionPage);

  // Get current page blocks
  const currentNotionPageBlocks = await getBlocksWithChildren(
    currentNotionPage.id
  );
  return json({
    currentNotionPage,
    currentNotionPageBlocks,
    ...(await topLevelMenuLoader()),
  });
};

export const links: LinksFunction = () => [...commonLinks()];

export const meta: MetaFunction = ({ data }) => {
  return {
    title: getTitle(data.currentNotionPage),
  };
};

export default function NotionDrivenPage() {
  const data = useLoaderData();
  return (
    <>
      <TopLevelMenu sitemapTree={data.sitemapTree} />
      <main className="container">
        <NotionRender blocks={data.currentNotionPageBlocks} />
        <Debug pageData={data} />
      </main>
    </>
  );
}
