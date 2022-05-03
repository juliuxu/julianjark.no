import { ActionFunction } from "@remix-run/node";
import config from "~/config.server";
import { flattenDepthFirst, getSitemapTree } from "../sitemap";
import { PassThrough } from "stream";
import { getDateOrUndefined, getNumberOrUndefined } from "~/common";

export const action: ActionFunction = async ({ request }) => {
  const outputStream = new PassThrough();

  const url = new URL(request.url);
  const searchParams = {
    onlyEditedLastNSeconds: getNumberOrUndefined(
      url.searchParams.get("onlyEditedLastNSeconds")
    ),
    onlyEditedSinceDate: getDateOrUndefined(
      url.searchParams.get("onlyEditedSinceDate")
    ),
  };

  async function inner() {
    const now = new Date();
    outputStream.write("🌍 fetching sitemap\n");
    const sitemapTree = await getSitemapTree();

    const results = await Promise.all(
      flattenDepthFirst(sitemapTree)
        .filter((page) => {
          if (page.lastmod === undefined) return true;

          if (searchParams.onlyEditedSinceDate) {
            return new Date(page.lastmod) > searchParams.onlyEditedSinceDate;
          }

          if (searchParams.onlyEditedLastNSeconds) {
            const timeSincePageWasLastEdited = Math.abs(
              Math.floor(
                (now.getTime() - new Date(page.lastmod).getTime()) / 1000
              )
            );
            return (
              timeSincePageWasLastEdited < searchParams.onlyEditedLastNSeconds
            );
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
          outputStream.write(`🔥 purging ${path}\n`);
          return fetch(`${config.baseUrl}${path}`, {
            method: "HEAD",
            headers: { "Cache-Purge": "1" },
          });
        })
    );
    if (results.length === 0) {
      outputStream.write("🆗 no pages to be purged with given filter\n");
    }
    outputStream.write("✅ done\n");
    outputStream.end();
  }
  inner();

  return new Response(outputStream as any, {
    headers: { "cache-control": "no-store", "content-type": "plain/text" },
  });
};
