import { json, LinksFunction, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { slugify, getTitle } from "~/service/notion";
import Code from "~/components/code";
import { commonLinks } from "~/common";
import { getDatabasePages } from "~/service/notionApi.server";
import config from "~/config.server";
import { meta as indexMeta } from "~/routes/index";
import { meta as presentasjonerMeta } from "~/routes/presentasjoner/index";

interface Page {
  title: string;
  path: string;
  children: Page[];
}

export const getSitemapTree = async () => {
  const landing: Page = {
    title: indexMeta({} as any).title!,
    path: "/",
    children: [
      // { title: "Drinker", path: "/drinker" }

      {
        title: presentasjonerMeta({} as any).title!,
        path: "/presentasjoner",
        children: await pagesFromNotionDatabase(
          "/presentasjoner/",
          config.presentasjonerDatabaseId
        ),
      },

      ...(await pagesFromNotionDatabase(
        "/",
        config.notionDrivenPagesDatabaseId
      )),
    ],
  };

  return landing;
};

const pagesFromNotionDatabase = async (
  parentPath: string,
  databaseId: string
) => {
  const result: Page[] = [];
  for (const databasePage of await getDatabasePages(databaseId)) {
    const title = getTitle(databasePage);
    result.push({
      title,
      path: `${parentPath}${slugify(title)}`,
      children: [], // Fow now we don't allow child pages
    });
  }
  return result;
};

export const loader: LoaderFunction = async ({ request }) => {
  const sitemapTree = await getSitemapTree();
  return json(sitemapTree);
};

export const links: LinksFunction = () => [...commonLinks()];
export default function Sitemap() {
  const data = useLoaderData();
  return <Code code={JSON.stringify(data, null, 2)} language={"json"} />;
}
