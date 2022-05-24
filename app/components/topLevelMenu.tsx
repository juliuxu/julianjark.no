import { NavLink } from "@remix-run/react";
import { getSitemapTree } from "~/sitemap.server";
import {
  CachePurgeAllPagesButton,
  CachePurgeCurrentPageButton,
} from "./cachePurgeButton";
import { DebugToggle, useIsDebugMode } from "./debug";

export const loader = async () => ({ sitemapTree: await getSitemapTree() });

type Props = Awaited<ReturnType<typeof loader>>;
export default function TopLevelMenu({ sitemapTree }: Props) {
  const debugMode = useIsDebugMode();
  return (
    <nav>
      <ul>
        <li>
          <NavLink to={sitemapTree.path}>{sitemapTree.title}</NavLink>
        </li>
        <li
          className="hidden-block dev-features"
          style={debugMode ? { opacity: 1 } : {}}
        >
          <DebugToggle />
          <CachePurgeCurrentPageButton />
          <CachePurgeAllPagesButton onlyEditedLastNSeconds={4 * 60 * 60}>
            ⏱
          </CachePurgeAllPagesButton>
          <CachePurgeAllPagesButton />
        </li>
      </ul>
      <ul>
        {sitemapTree.children.map((page) => (
          <li key={page.path}>
            <NavLink to={page.path} prefetch="intent">
              {page.title}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
