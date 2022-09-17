import config from "~/config";
import {
  getDrinker,
  getNotionDrivenPages,
  getPresentasjoner,
  getTitle,
  getTodayILearnedEntries,
  slugify,
} from "~/notion/notion";
import type { DatabasePage } from "~/notion/notion-api.server";
import { getPage } from "~/notion/notion-api.server";
import { meta as forsideMeta } from "~/routes/__layout/index";
import { meta as dranksMeta } from "~/routes/dranks/index";
import { flattenDepthFirst } from "./utils";

export interface Page {
  title: string;
  path: string;
  codePath: string;
  lastmod: string;
}
export type PageWithChildren = Page & { children: PageWithChildren[] };

type PageStruct = {
  page: Page | (() => Promise<Page>);
  children?:
    | Array<PageStruct | (() => Promise<PageStruct[]>)>
    | (() => Promise<PageStruct[]>);
};

// TODO: Move to handle functions
const siteTree: PageStruct = {
  page: async () => ({
    title: forsideMeta({} as any).title!,
    path: "/",
    lastmod: (await getPage(config.forsidePageId)).last_edited_time,
    codePath: "routes/__layout/index",
  }),
  children: [
    // Today I Learned
    {
      page: async () => ({
        title: forsideMeta({} as any).title!,
        path: "/today-i-learned",
        lastmod: (await getTodayILearnedEntries())
          .map((page) => page.last_edited_time)
          .sort()
          .reverse()[0],
        codePath: "routes/__layout/today-i-learned",
      }),
    },

    // Dranks
    {
      page: async () => ({
        title: dranksMeta({} as any).title!,
        path: "/dranks",
        lastmod: (await getDrinker())
          .map((page) => page.last_edited_time)
          .sort()
          .reverse()[0],
        codePath: "routes/dranks/index",
      }),
      children: async () =>
        (await getDrinker())
          .map(databasePageToPage("/dranks/", "routes/dranks/$drank"))
          .map((page) => ({ page })),
    },

    // Notion Driven Page
    async () =>
      (await getNotionDrivenPages())
        .map(databasePageToPage("/", "routes/__layout/$notionDrivenPage"))
        .map((page) => ({ page })),
  ],
};

export const getSitemapTree = async (
  it: PageStruct = siteTree,
): Promise<PageWithChildren> => {
  const page = typeof it.page === "function" ? it.page() : it.page;

  let children: PageWithChildren[] | Promise<PageWithChildren[]> = [];
  if (typeof it.children === "undefined") {
    children = [];
  } else if (typeof it.children === "function") {
    children = it.children().then((l) => Promise.all(l.map(getSitemapTree)));
  } else if (typeof it.children === "object") {
    const promiseList = it.children.map((x) =>
      typeof x === "function" ? x() : x,
    );
    children = Promise.all(promiseList)
      .then((l) => l.flat())
      .then((l) => Promise.all(l.map(getSitemapTree)));
  }

  return {
    ...(await page),
    children: await children,
  };
};

const databasePageToPage =
  (parentPath: string, codePath: string) =>
  (page: DatabasePage): Page => {
    const title = getTitle(page);
    return {
      title,
      path: `${parentPath}${slugify(title)}`,
      codePath,
      lastmod: page.last_edited_time,
    };
  };

export const asUrlList = (rootPage: PageWithChildren): string[] =>
  flattenDepthFirst(rootPage).map((page) => `${config.baseUrl}${page.path}`);
