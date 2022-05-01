import { NavLink } from "@remix-run/react";
import { getSitemapTree } from "~/routes/sitemap";
import {
  CachePurgeAllPagesButton,
  CachePurgeCurrenPageButton,
} from "./cachePurgeButton";
import { DebugToggle, OnlyDebugMode } from "./debug";

export const loader = async () => ({ sitemapTree: await getSitemapTree() });

type Props = Awaited<ReturnType<typeof loader>>;
export default function TopLevelMenu({ sitemapTree }: Props) {
  return (
    <nav>
      <ul>
        <li>
          <NavLink to={sitemapTree.path}>{sitemapTree.title}</NavLink>
        </li>
        <li>
          <DebugToggle />
        </li>
        <li>
          <OnlyDebugMode>
            <CachePurgeCurrenPageButton />
            <CachePurgeAllPagesButton />
          </OnlyDebugMode>
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
