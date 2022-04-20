import {
  json,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import TopLevelMenu, {
  loader as topLevelMenuLoader,
} from "~/components/topLevelMenu";
import prismTomorrow from "prismjs/themes/prism-tomorrow.css";

import picoCss from "@picocss/pico/css/pico.min.css";

import commonStyles from "~/styles/common.css";
import notionRenderStyles from "~/styles/notionRender.css";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: picoCss,
  },
  { rel: "stylesheet", href: prismTomorrow },
  {
    rel: "stylesheet",
    href: commonStyles,
  },
  {
    rel: "stylesheet",
    href: notionRenderStyles,
  },
];

export const loader: LoaderFunction = async () => {
  return json({
    ...(await topLevelMenuLoader()),
  });
};

export const meta: MetaFunction = () => ({
  title: "Julian Jark",
});

export default function Layout() {
  const data = useLoaderData();
  return (
    <>
      <header className="container">
        <TopLevelMenu sitemapTree={data.sitemapTree} />
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
