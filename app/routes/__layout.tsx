import type { LinksFunction, MetaFunction } from "@remix-run/node";
import { NavLink, Outlet, useMatches } from "@remix-run/react";

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
      <header className="mx-[5vw] h-20">
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

const menuItems = ["🚧 Prosjekter", "Dranks", "Blogg", "Today I Learned"];

const Header = () => {
  const lastMatch = useMatches().reverse()[0];
  const pageOrDatabaseId = {
    "/": { pageId: config.forsidePageId },
    "/blogg": { databaseId: config.bloggDatabaseId },
    "/today-i-learned": { databaseId: config.todayILearnedDatabaseId },
  }[lastMatch.pathname];

  return (
    <nav className="flex h-full flex-wrap items-center gap-8 font-mono text-white">
      <NavLink to="/" className="text-3xl" prefetch="intent">
        Julian Jark
      </NavLink>
      <div className="flex items-center gap-4">
        {menuItems
          .filter((x) => !x.includes("🚧"))
          .filter(
            (x) => x !== "Blogg" || process.env.NODE_ENV === "development",
          )
          .map((x) => (
            <NavLink
              key={x}
              to={slugify(x)}
              prefetch="intent"
              className={({ isActive }) =>
                `rounded-2xl border-2 p-2 ${
                  isActive
                    ? "border-white text-white"
                    : "border-gray-400 text-gray-400"
                } transition hover:border-white hover:text-white focus:border-white focus:text-white`
              }
            >
              {x}
            </NavLink>
          ))}
        <HiddenFeature shortcut="x">
          <div className="-mt-[1px] opacity-40 transition-opacity focus-within:opacity-100 hover:opacity-100">
            <CachePurgeCurrentPageButton />
          </div>
          {pageOrDatabaseId && (
            <div className="-ml-3 -mt-[3px] opacity-40 transition-opacity focus-within:opacity-100 hover:opacity-100">
              <NotionWatcherButton {...pageOrDatabaseId} />
            </div>
          )}
        </HiddenFeature>
      </div>
    </nav>
  );
};
