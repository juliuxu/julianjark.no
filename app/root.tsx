import type { MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import picoCss from "@picocss/pico/css/pico.classless.min.css";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Julian Jark",
  viewport: "width=device-width,initial-scale=1",
});

export function links() {
  return [
    {
      rel: "stylesheet",
      href: picoCss,
    },
  ];
}

export default function App() {
  return (
    <html lang="no">
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
