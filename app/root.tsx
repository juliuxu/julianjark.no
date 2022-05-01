import { LinksFunction, MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Julian Jark",
  viewport: "width=device-width,initial-scale=1",

  // "theme-color": [
  //   {
  //     name: "theme-color",
  //     content: "#11191f",
  //     media: "(prefers-color-scheme: dark)",
  //   },
  //   {
  //     name: "theme-color",
  //     content: "#fff",
  //     media: "(prefers-color-scheme: light)",
  //   },
  // ],
  "theme-color": "#11191f",
});

export const links: LinksFunction = () => [
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  {
    rel: "icon",
    type: "image/png",
    sizes: "32x32",
    href: "/favicon-32x32.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "16x16",
    href: "/favicon-16x16.png",
  },
  { rel: "manifest", href: "/site.webmanifest" },
];

export default function App() {
  return (
    <html lang="no" data-theme="dark">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
