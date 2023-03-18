import { NavLink, useMatches } from "@remix-run/react";

import { CachePurgeCurrentPageButton } from "~/components/cache-purge-button";
import { HiddenFeature } from "~/components/hidden-feature";
import { NotionWatcherButton } from "~/components/notion-watcher-button";
import config from "~/config";

export interface MenuItem {
  title: string;
  to: string;
  // icon?: string;
  // color?: string;
}
interface HeaderProps {
  menuItems: MenuItem[];
}

export const Header = ({ menuItems }: HeaderProps) => {
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
