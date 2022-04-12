import {
  json,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import picoCss from "@picocss/pico/css/pico.classless.min.css";
import { links as codeLinks } from "./components/code";
import TopLevelMenu, {
  loader as topLevelMenuLoader,
} from "./components/topLevelMenu";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Julian Jark",
  viewport: "width=device-width,initial-scale=1",
});

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: picoCss,
  },

  // Showing code with prismjs
  // For simplicty make this global, for now.
  ...codeLinks(),
];

export const loader: LoaderFunction = async () => {
  const topLevelMenuData = await topLevelMenuLoader();
  console;
  return json({ topLevelMenuData });
};

export default function App() {
  const data = useLoaderData();
  return (
    <html lang="no">
      <head>
        <Meta {...data.topLevelMenuData} />
        <Links />
      </head>
      <body>
        {/* For now show menu in root */}
        <TopLevelMenu {...data.topLevelMenuData} />
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
