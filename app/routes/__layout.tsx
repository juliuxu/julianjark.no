import { NavLink, Outlet, useMatches } from "@remix-run/react";
import type { LinksFunction, MetaFunction } from "@remix-run/server-runtime";

import { CachePurgeCurrentPageButton } from "~/components/cache-purge-button";
import { HiddenFeature } from "~/components/hidden-feature";
import { NotionWatcherButton } from "~/components/notion-watcher-button";
import config from "~/config";
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
      <header className="h-20 mx-[5vw]">
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

const menuItems = ["🚧 Prosjekter", "🚧 Blogg", "Dranks", "Today I Learned"];

const Header = () => {
  const lastMatch = useMatches().reverse()[0];
  const pageOrDatabaseId = {
    "/": { pageId: config.forsidePageId },
    "/today-i-learned": { databaseId: config.todayILearnedDatabaseId },
  }[lastMatch.pathname];

  return (
    <nav className="text-white font-mono flex flex-wrap items-center gap-8 h-full">
      <NavLink to="/" className="text-3xl" prefetch="intent">
        Julian Jark
      </NavLink>
      <div className="flex items-center gap-4">
        {menuItems
          .filter((x) => !x.includes("🚧"))
          .map((x) => (
            <NavLink
              key={x}
              to={slugify(x)}
              prefetch="intent"
              className={({ isActive }) =>
                `rounded-2xl p-2 border-2 ${
                  isActive
                    ? "text-white border-white"
                    : "text-gray-400 border-gray-400"
                } focus:border-white hover:border-white focus:text-white hover:text-white transition`
              }
            >
              {x}
            </NavLink>
          ))}
        <HiddenFeature shortcut="x">
          <div className="opacity-40 focus-within:opacity-100 hover:opacity-100 transition-opacity -mt-[1px]">
            <CachePurgeCurrentPageButton />
          </div>
          {pageOrDatabaseId && (
            <div className="opacity-40 focus-within:opacity-100 hover:opacity-100 transition-opacity -ml-3 -mt-[3px]">
              <NotionWatcherButton {...pageOrDatabaseId} />
            </div>
          )}
        </HiddenFeature>
      </div>
    </nav>
  );
};
