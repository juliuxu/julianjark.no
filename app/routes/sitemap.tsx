import { json, LinksFunction, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  slugify,
  getTitle,
  getPresentasjoner,
  getNotionDrivenPages,
} from "~/service/notion";
import Code from "~/components/code";
import { DatabasePage } from "~/service/notionApi.server";
import config from "~/config.server";
import { meta as indexMeta } from "~/routes/__layout";
import { meta as presentasjonerMeta } from "~/routes/__layout/presentasjoner/index";

export interface Page {
  title: string;
  path: string;
  children: Page[];
}

export const getSitemapTree = async () => {
  const landing: Page = {
    title: indexMeta({} as any).title!,
    path: "/",
    children: [
      {
        title: presentasjonerMeta({} as any).title!,
        path: "/presentasjoner",
        children: (await getPresentasjoner()).map(
          databasePagesToPage("/presentasjoner/")
        ),
      },

      ...(await getNotionDrivenPages()).map(databasePagesToPage("/")),
    ],
  };

  return landing;
};

const databasePagesToPage =
  (parentPath: string) =>
  (page: DatabasePage): Page => {
    const title = getTitle(page);
    return {
      title,
      path: `${parentPath}${slugify(title)}`,
      children: [], // Fow now we don't allow child pages
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

export const loader: LoaderFunction = async () => {
  const sitemapTree = await getSitemapTree();
  return json({ sitemapTree, urlList: asUrlList(sitemapTree) });
};

export default function Sitemap() {
  const data = useLoaderData();
  return <Code code={JSON.stringify(data, null, 2)} language={"json"} />;
}
