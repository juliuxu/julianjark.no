import { Render } from "@9gustin/react-notion-render";
import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { CollapsedCode } from "~/components/code";
import { landingPage } from "~/service/notion";

export const loader: LoaderFunction = async () => {
  const landingPageBlocks = await landingPage();
  return json({ landingPageBlocks });
};

export const meta: MetaFunction = () => {
  return {
    title: "Julian Jark",
  };
};

export default function Index() {
  const { landingPageBlocks } = useLoaderData();
  return (
    <main>
      <Render blocks={landingPageBlocks} />
      <CollapsedCode
        language="json"
        code={JSON.stringify(landingPageBlocks, null, 2)}
        title={`Response (${JSON.stringify(landingPageBlocks).length} bytes)`}
      />
    </main>
  );
}
