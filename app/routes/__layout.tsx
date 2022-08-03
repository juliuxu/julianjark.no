import type {
  HeadersFunction,
  LinksFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";

import picoCss from "@picocss/pico/css/pico.min.css";

import TopLevelMenu, {
  loader as topLevelMenuLoader,
} from "~/components/top-level-menu";
import config from "~/config.server";
import codeStyles from "~/styles/code.css";
import commonStyles from "~/styles/common.css";
import notionRenderStyles from "~/styles/notionRender.css";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: picoCss,
  },
  {
    rel: "stylesheet",
    href: commonStyles,
  },
  {
    rel: "stylesheet",
    href: codeStyles,
  },
  {
    rel: "stylesheet",
    href: notionRenderStyles,
  },
];

export const loader = async () => {
  return json(
    {
      ...(await topLevelMenuLoader()),
    },
    { headers: config.cacheControlHeaders },
  );
};

export const meta: MetaFunction = () => ({
  title: "Julian Jark",
});

export const headers: HeadersFunction = () => {
  return {
    ...config.cacheControlHeaders,
  };
};

export default function Layout() {
  const data = useLoaderData<typeof loader>();
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
