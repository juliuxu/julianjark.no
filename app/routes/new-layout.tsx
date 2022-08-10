import type { LinksFunction, MetaFunction } from "@remix-run/node";
import { NavLink, Outlet } from "@remix-run/react";

import { slugify } from "~/notion/notion";
import designTokens from "~/styles/design-tokens.json";
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

export const meta: MetaFunction = () => ({
  "theme-color": designTokens.colors.dark,
});

export default function NewLayout() {
  return (
    <>
      <header className="h-20 container mx-auto px-8 sm:px-16 xl:px-48">
        <Header />
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="h-10"></footer>
    </>
  );
}

const menuItems = ["Prosjekter", "Blogg", "Today I Learned"];

const baseUrl = "/new-layout";
const link = (path: string) => baseUrl + path;
const Header = () => {
  return (
    <nav className="text-white flex flex-row items-center h-full">
      <NavLink to={link("/")} className="text-4xl">
        Julian Jark
      </NavLink>
      {menuItems.map((x) => (
        <NavLink key={x} to={slugify(x)}>
          {x}
        </NavLink>
      ))}
    </nav>
  );
};
