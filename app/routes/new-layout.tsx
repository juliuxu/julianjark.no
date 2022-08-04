import type { LinksFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import globalCss from "~/styles/global.css";
import newLayoutCss from "~/styles/new-layout.css";
import shikiCodeCss from "~/styles/shiki-code.css";
import tailwind from "~/tailwind.css";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: tailwind,
  },
  {
    rel: "stylesheet",
    href: globalCss,
  },
  {
    rel: "stylesheet",
    href: shikiCodeCss,
  },
  {
    rel: "stylesheet",
    href: newLayoutCss,
  },
];

export default function NewLayout() {
  return (
    <>
      <header className="h-20">
        <h2 className="text-white">hallo</h2>
      </header>
      <main className="container mx-auto px-8 sm:px-16 xl:px-48 ">
        <Outlet />
      </main>
      <footer className="h-10"></footer>
    </>
  );
}
