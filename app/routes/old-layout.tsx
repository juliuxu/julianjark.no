import type {
  HeadersFunction,
  LinksFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";

import picoCss from "@picocss/pico/css/pico.min.css";

import config from "~/config";
import commonStyles from "~/styles/common.css";
import designTokens from "~/styles/design-tokens.json";
import notionRenderStyles from "~/styles/notionRender.css";
import codeStyles from "~/styles/shiki-code.css";

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

export const meta: MetaFunction = () => ({
  title: "Julian Jark",
  "theme-color": designTokens.colors.dark,
});

export const headers: HeadersFunction = () => {
  return {
    ...config.cacheControlHeaders,
  };
};

export default function Layout() {
  return (
    <>
      <header className="container">
        {/* <TopLevelMenu sitemapTree={data.sitemapTree} /> */}
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
