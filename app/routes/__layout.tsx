import type { LinksFunction, LoaderArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { NavLink, Outlet, useLoaderData, useMatches } from "@remix-run/react";

import { CachePurgeCurrentPageButton } from "~/components/cache-purge-button";
import { HiddenFeature } from "~/components/hidden-feature";
import { NotionWatcherButton } from "~/components/notion-watcher-button";
import config from "~/config";
import { getNotionDrivenPages, getTitle, slugify } from "~/notion/notion";
import designTokens from "~/styles/design-tokens.json";
import layoutCss from "~/styles/layout.css";
import shikiCodeCss from "~/styles/shiki-code.css";
import tailwind from "~/styles/tailwind.css";
import { isDevMode } from "~/utils";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: tailwind,
  },
  {
    rel: "stylesheet",
    href: shikiCodeCss,
  },
  {
    rel: "stylesheet",
    href: layoutCss,
  },
];

export const meta: MetaFunction = () => ({
  "theme-color": designTokens.colors.dark,
});

const staticMenuItemStrings = ["Dranks", "🚧 Blogg", "Today I Learned"];
export const loader = async ({ request }: LoaderArgs) => {
  const staticMenuItems = staticMenuItemStrings
    .filter((x) => isDevMode(request) || !x.includes("🚧"))
    .map((x) => x.replace("🚧", "").trim())
    .map((x): MenuItem => ({ title: x, to: slugify(x) }));

  const dynamicMenuItems = (await getNotionDrivenPages(request)).map(
    (x): MenuItem => ({ title: getTitle(x), to: slugify(getTitle(x)) }),
  );

  const menuItems = [...dynamicMenuItems, ...staticMenuItems];

  return json({ menuItems });
};

// https://remix.run/docs/en/v1/api/conventions#never-reloading-the-root
export const unstable_shouldReload = () => false;

export default function Layout() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <div className="h-full bg-[#11191f]">
        <header className="mx-[5vw] h-20">
          <div className="mx-auto h-full">
            <Header menuItems={data.menuItems} />
          </div>
        </header>
        <main className="pt-10">
          <Outlet />
        </main>
        <footer className="h-10"></footer>
      </div>
    </>
  );
}

interface MenuItem {
  title: string;
  to: string;
  // icon?: string;
  // color?: string;
}
interface HeaderProps {
  menuItems: MenuItem[];
}
const Header = ({ menuItems }: HeaderProps) => {
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
        {menuItems.map(({ to, title }) => (
          <NavLink
            key={to}
            to={to}
            prefetch="intent"
            className={({ isActive }) =>
              `rounded-2xl border-2 p-2 ${
                isActive
                  ? "border-white text-white"
                  : "border-gray-400 text-gray-400"
              } transition hover:border-white hover:text-white focus:border-white focus:text-white`
            }
          >
            {title}
          </NavLink>
        ))}

        {/* DEV */}
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
