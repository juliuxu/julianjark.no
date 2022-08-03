import type { LinksFunction, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import picoCss from "@picocss/pico/css/pico.min.css";

import PrismCode from "~/components/prism-code";
import prepareCodeHtml from "~/packages/notion-shiki-code/prepare.server";
import ShikiCode from "~/packages/notion-shiki-code/shiki-code";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: picoCss,
  },
];

const codeText = `
export const loader: LoaderFunction = async () => {
  const codeHtml = await prepareCodeHtml(codeText, {
    lang: "jsx",
    theme: "dark-plus",
  });
  return json({ codeHtml, codeText });
};

export default function CodeTest() {
  const data = useLoaderData();
  return (
    <main className="container">
      <h1>Code</h1>
      <CodeRender codeHtml={data.codeHtml} />
    </main>
  );
}
`.trim();

export const loader = async ({}: LoaderArgs) => {
  const codeHtml = await prepareCodeHtml(codeText, {
    lang: "tsx",
    theme: "dark-plus",
  });
  return json({ codeHtml, codeText });
};

export default function CodeTest() {
  const data = useLoaderData<typeof loader>();
  // const [x, setX] = useState("");
  // useEffect(() => {
  //   isoPrepare(data.codeText, { lang: "tsx" }).then((codeHtml) => {
  //     alert("done with prepare");
  //     setX(codeHtml);
  //   });
  // }, []);

  return (
    <main className="container">
      <h1>Code</h1>
      <div className="grid">
        {/* <div>
          <h2>Using Shiki</h2>
          <ShikiCode codeHtml={x} />
        </div> */}
        <div>
          <h2>Using Shiki (server rendered)</h2>
          <ShikiCode codeHtml={data.codeHtml} />
        </div>
        <div>
          <h2>Using Prism</h2>
          <PrismCode code={data.codeText} language="tsx" />
        </div>
      </div>
    </main>
  );
}
