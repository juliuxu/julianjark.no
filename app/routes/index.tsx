import { Render } from "@9gustin/react-notion-render";
import {
  json,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { commonLinks } from "~/common";
import Debug from "~/components/debug";
import ExtendedNotionRender from "~/components/ExtendedNotionRender";
import TopLevelMenu, {
  loader as topLevelMenuLoader,
} from "~/components/topLevelMenu";
import { getLandingPage } from "~/service/notion";
import { Block } from "~/service/notion.types";

export const loader: LoaderFunction = async () => {
  const landingPageBlocks = await getLandingPage();
  return json({
    landingPageBlocks,
    ...(await topLevelMenuLoader()),
  });
};

export const links: LinksFunction = () => [...commonLinks()];
export const meta: MetaFunction = () => ({
  title: "Julian Jark",
});

export default function Index() {
  const data = useLoaderData();
  const blocks = data.landingPageBlocks as Block[];
  return (
    <>
      <TopLevelMenu sitemapTree={data.sitemapTree} />
      <main className="container">
        <ExtendedNotionRender blocks={blocks} />
        <Debug pageData={blocks} />
      </main>
    </>
  );
}
