import { json, ActionFunction } from "@remix-run/node";
import config from "~/config.server";
import { flattenDepthFirst, getSitemapTree } from "../sitemap";
import { PassThrough } from "stream";

export const action: ActionFunction = async ({ request }) => {
  const outputStream = new PassThrough();

  async function inner() {
    const now = new Date();
    outputStream.write("🌍 fetching sitemap\n");
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
          outputStream.write(`🔥 purging ${path}\n`);
          return fetch(`${config.baseUrl}${path}`, {
            method: "HEAD",
            headers: { "Cache-Purge": "1" },
          });
        })
    );
    outputStream.write("✅ done");
    outputStream.end();
  }
  inner();

  return new Response(outputStream as any, {
    headers: { "cache-control": "no-store", "content-type": "plain/text" },
  });
};
