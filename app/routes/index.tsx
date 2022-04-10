import { Render } from "@9gustin/react-notion-render";
import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Code, { links as codeLinks } from "~/components/code";
import { getBlocksWithChildren } from "~/notion";

export const links = () => {
  return [...codeLinks()];
};

export const loader: LoaderFunction = async () => {
  const blocks = await getBlocksWithChildren(
    "86ff219a78b94a7a8654d096d9f3096d"
  );
  return json({ blocks });
};

export default function Index() {
  const { blocks } = useLoaderData();
  return (
    <main>
      <h1>Julian Jark</h1>
      <h2>Test</h2>
      <Render blocks={blocks} />

      <details>
        <summary>Response ({JSON.stringify(blocks).length} bytes)</summary>
        <Code language="json" code={JSON.stringify(blocks, null, 2)} />
      </details>
    </main>
  );
}
