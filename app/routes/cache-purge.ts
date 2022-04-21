import { json, LoaderFunction } from "@remix-run/node";
import { asUrlList, getSitemapTree } from "./sitemap";
const baseUrl = "https://julianjark.no";

export const loader: LoaderFunction = async () => {
  const sitemapTree = await getSitemapTree();
  const urlList = asUrlList(sitemapTree);

  await Promise.all(
    urlList.map((url) =>
      fetch(url, { method: "HEAD", headers: { "Cache-Purge": "1" } })
    )
  );

  return json(
    { purged: true },
    { status: 200, headers: { "cache-control": "no-cache" } }
  );
};
