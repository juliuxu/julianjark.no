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
      <header className="h-20 mx-[10vw] md:mx-[5vw]">
        <div className="mx-auto h-full">
          <Header />
        </div>
      </header>
      <main className="pt-10">
        <Outlet />
      </main>
      <footer className="h-10"></footer>
    </>
  );
}

const menuItems = ["🚧 Prosjekter", "🚧 Blogg", "Today I Learned"];

const baseUrl = "/";
const link = (path: string) => baseUrl + path;
const Header = () => {
  return (
    <nav className="text-white font-mono flex flex-wrap items-center gap-8 h-full">
      <NavLink to={link("/")} className="text-3xl" prefetch="intent">
        Julian <span className="hidden sm:inline-block">Jark</span>
      </NavLink>
      <div className="flex items-center gap-4">
        {menuItems.map((x) => (
          <NavLink key={x} to={slugify(x)} prefetch="intent">
            {x}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
