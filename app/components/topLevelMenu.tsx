import { NavLink } from "@remix-run/react";
import { getSitemapTree } from "~/routes/sitemap";

export const loader = async () => ({ sitemapTree: await getSitemapTree() });

type Props = Awaited<ReturnType<typeof loader>>;
export default function TopLevelMenu({ sitemapTree }: Props) {
  return (
    <header>
      <nav>
        <ul>
          <li key={sitemapTree.path}>
            <NavLink to={sitemapTree.path}>{sitemapTree.title}</NavLink>
          </li>
        </ul>
        <ul>
          {sitemapTree.children.map((page) => (
            <li key={page.path}>
              <NavLink to={page.path}>{page.title}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
