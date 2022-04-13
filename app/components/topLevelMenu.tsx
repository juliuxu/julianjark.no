import { NavLink } from "@remix-run/react";
import { getTitle, getNotionDrivenPages, slugify } from "~/service/notion";

interface Page {
  title: string;
  path: string;
}

/**
 * TODO:
 * - [ ] Get title from the route
 * - [ ] Get route from the route 🤨
 */
export const getTopLevelPages = async () => {
  const result: Page[] = [];

  result.push({ title: "Julian Jark", path: "/" });
  result.push({ title: "Drinker", path: "/drinker" });
  result.push({ title: "Presentasjoner", path: "/presentasjoner" });

  for (const notionDrivenPage of await getNotionDrivenPages()) {
    const title = getTitle(notionDrivenPage);
    result.push({
      title,
      path: `/${slugify(title)}`,
    });
  }

  return result;
};

// TODO: Perhaps this should be a page instead?
export const loader = async (): Promise<Page[]> => await getTopLevelPages();

interface Props {
  topLevelPages: Page[];
}
export default function TopLevelMenu({ topLevelPages }: Props) {
  return (
    <header>
      <nav>
        <ul>
          {topLevelPages.slice(0, 1).map((page) => (
            <li key={page.path}>
              <NavLink to={page.path}>{page.title}</NavLink>
            </li>
          ))}
        </ul>
        <ul>
          {topLevelPages.slice(1).map((page) => (
            <li key={page.path}>
              <NavLink to={page.path}>{page.title}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
