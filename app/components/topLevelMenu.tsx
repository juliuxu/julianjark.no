import { NavLink } from "@remix-run/react";
import { getSitemapTree } from "~/routes/sitemap";

export const loader = async () => ({ sitemapTree: await getSitemapTree() });

type Props = Awaited<ReturnType<typeof loader>>;
export default function TopLevelMenu({ sitemapTree }: Props) {
  return (
    <header>
      <nav>
        <ul>
          <li>
            <NavLink to={sitemapTree.path}>{sitemapTree.title}</NavLink>
          </li>
          <li>
            <fieldset>
              <label htmlFor="debugMode" className="debugButton">
                🧑‍💻
                <input
                  type="checkbox"
                  id="debugMode"
                  name="debugMode"
                  role="switch"
                />
              </label>
            </fieldset>
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
