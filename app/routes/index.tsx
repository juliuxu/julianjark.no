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
    topLevelMenuData: await topLevelMenuLoader(),
  });
};

export const links: LinksFunction = () => [...commonLinks()];
export const meta: MetaFunction = () => {
  return {
    title: "Julian Jark",
  };
};

export default function Index() {
  const { landingPageBlocks, topLevelMenuData } = useLoaderData();
  return (
    <>
      <TopLevelMenu topLevelPages={topLevelMenuData} />
      <main>
        <Render blocks={landingPageBlocks} />
        <CollapsedCode
          language="json"
          code={JSON.stringify(landingPageBlocks, null, 2)}
          title={`Response (${JSON.stringify(landingPageBlocks).length} bytes)`}
        />
      </main>
    </>
  );
}
