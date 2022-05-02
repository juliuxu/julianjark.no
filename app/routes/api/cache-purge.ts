import { json, ActionFunction } from "@remix-run/node";
import config from "~/config.server";
import { flattenDepthFirst, getSitemapTree } from "../sitemap";

export const action: ActionFunction = async ({ request }) => {
  const now = new Date();
  const sitemapTree = await getSitemapTree();

  const onlyEditedLastNSeconds = new URL(request.url).searchParams.get(
    "onlyEditedLastNSeconds"
  );
  const seconds =
    onlyEditedLastNSeconds && Number.parseInt(onlyEditedLastNSeconds);

  await Promise.all(
    flattenDepthFirst(sitemapTree)
      // If onlyEditedLastNSeconds is given correctly, only purge sites edited during the given time period
      .filter((page) => {
        if (Number.isInteger(seconds) && page.lastmod !== undefined) {
          const diff = Math.abs(
            Math.floor(
              (now.getTime() - new Date(page.lastmod).getTime()) / 1000
            )
          );
          return diff < (seconds as number);
        }
        return true;
      })
      .flatMap((page) => {
        return [
          page.path,
          `${page.path}?_data=${encodeURIComponent(page.codePath)}`,
        ];
      })
      .map((path) => {
        console.log(`🔥 purging ${path}`);
        return fetch(`${config.baseUrl}${path}`, {
          method: "HEAD",
          headers: { "Cache-Purge": "1" },
        });
      })
  );

  return json(
    { purged: true },
    { status: 200, headers: { "cache-control": "no-store" } }
  );
};
