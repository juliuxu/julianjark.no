import { Render } from "@9gustin/react-notion-render";
import {
  json,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { commonLinks } from "~/common";
import { CollapsedCode } from "~/components/code";
import TopLevelMenu, {
  loader as topLevelMenuLoader,
} from "~/components/topLevelMenu";
import { getLandingPage } from "~/service/notion";

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
  return (
    <>
      <TopLevelMenu sitemapTree={data.sitemapTree} />
      <main>
        <Render blocks={data.landingPageBlocks} />
        <CollapsedCode
          language="json"
          code={JSON.stringify(data.landingPageBlocks, null, 2)}
          title={`Response (${
            JSON.stringify(data.landingPageBlocks).length
          } bytes)`}
        />
      </main>
    </>
  );
}
