import {
  HeadersFunction,
  json,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import TopLevelMenu, {
  loader as topLevelMenuLoader,
} from "~/components/topLevelMenu";

import picoCss from "@picocss/pico/css/pico.min.css";

import commonStyles from "~/styles/common.css";
import notionRenderStyles from "~/styles/notionRender.css";
import config from "~/config.server";

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
    href: notionRenderStyles,
  },
];

export const loader: LoaderFunction = async () => {
  return json(
    {
      ...(await topLevelMenuLoader()),
    },
    { headers: config.cacheControlHeaders }
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
