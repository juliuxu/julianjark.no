import { json, ActionFunction } from "@remix-run/node";
import { asUrlList, getSitemapTree } from "./sitemap";

export const action: ActionFunction = async () => {
  const sitemapTree = await getSitemapTree();
  const urlList = asUrlList(sitemapTree);

  await Promise.all(
    urlList.map((url) =>
      fetch(url, { method: "HEAD", headers: { "Cache-Purge": "1" } })
    )
  );

  return json(
    { purged: true },
    { status: 200, headers: { "cache-control": "no-store" } }
  );
};
