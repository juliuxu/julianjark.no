import {
  slugify,
  getTitle,
  getPresentasjoner,
  getNotionDrivenPages,
  getDrinker,
} from "~/notion/notion";
import { DatabasePage, getPage } from "~/notion/notion-api.server";
import config from "~/config.server";
import { meta as indexMeta } from "~/routes/__layout";
import { meta as presentasjonerMeta } from "~/routes/__layout/presentasjoner/index";
import { meta as drinkerMeta } from "~/routes/__layout/drinker-old/index";

export interface Page {
  title: string;
  path: string;
  codePath: string;
  children: Page[];
  lastmod: string;
}

export const getSitemapTree = async () => {
  // Initiate async call at once, await them later
  // This way they run in parallel, instead of sequentially
  const forsidePage = getPage(config.forsidePageId);
  const drinkerPages = getDrinker();
  const presentasjonerPages = getPresentasjoner();
  const notionDrivenPages = getNotionDrivenPages();

  const resolvedDrinkerPages = await drinkerPages;
  const resolvedPresentasjonerPages = await presentasjonerPages;

  const forside: Page = {
    title: indexMeta({} as any).title!,
    path: "/",
    codePath: "routes/__layout/index",
    lastmod: (await forsidePage).last_edited_time,
    children: [
      {
        title: drinkerMeta({} as any).title!,
        path: "/drinker",
        codePath: "routes/drinker/index",
        lastmod: resolvedDrinkerPages
          .map((page) => page.last_edited_time)
          .sort()
          .reverse()[0],
        children: resolvedDrinkerPages.map(
          databasePagesToPage("/drinker/", "routes/drinker/$drink")
        ),
      },
      {
        title: presentasjonerMeta({} as any).title!,
        path: "/presentasjoner",
        codePath: "routes/__layout/presentasjoner/index",
        lastmod: resolvedPresentasjonerPages
          .map((page) => page.last_edited_time)
          .sort()
          .reverse()[0],
        children: resolvedPresentasjonerPages.map(
          databasePagesToPage(
            "/presentasjoner/",
            "routes/presentasjoner.$presentasjon"
          )
        ),
      },

      ...(await notionDrivenPages).map(
        databasePagesToPage("/", "routes/__layout/$notionDrivenPage")
      ),
    ],
  };

  return forside;
};

const databasePagesToPage =
  (parentPath: string, codePath: string) =>
  (page: DatabasePage): Page => {
    const title = getTitle(page);
    return {
      title,
      path: `${parentPath}${slugify(title)}`,
      codePath,
      children: [], // Fow now we don't allow child pages
      lastmod: page.last_edited_time,
    };
  };

export function flattenDepthFirst<T extends { children: T[] }>(root: T) {
  const result: T[] = [];

  const stack: T[] = [];
  let current: T | undefined = root;
  while (current !== undefined) {
    const currentWithoutChildren = { ...current, children: [] };
    result.push(currentWithoutChildren);
    stack.unshift(...current.children);
    current = stack.shift();
  }

  return result;
}

export const asUrlList = (rootPage: Page): string[] =>
  flattenDepthFirst(rootPage).map((page) => `${config.baseUrl}${page.path}`);
