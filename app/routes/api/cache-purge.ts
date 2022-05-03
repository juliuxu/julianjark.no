import { ActionFunction } from "@remix-run/node";
import config from "~/config.server";
import { flattenDepthFirst, getSitemapTree } from "../sitemap";
import { PassThrough } from "stream";

export const action: ActionFunction = async ({ request }) => {
  const outputStream = new PassThrough();

  async function inner() {
    const now = new Date();
    outputStream.write("🌍 fetching sitemap\n");
    const sitemapTree = await getSitemapTree();

    const onlyEditedLastNSecondsParam = new URL(request.url).searchParams.get(
      "onlyEditedLastNSeconds"
    );
    const onlyEditedLastNSeconds =
      onlyEditedLastNSecondsParam &&
      Number.parseInt(onlyEditedLastNSecondsParam);

    const isValidDate = (d: any) => d instanceof Date && !isNaN(d);
    const onlyEditedSinceDateParam = new URL(request.url).searchParams.get(
      "onlyEditedSinceDate"
    );
    const onlyEditedSinceDate = new Date(onlyEditedSinceDateParam as any);

    await Promise.all(
      flattenDepthFirst(sitemapTree)
        .filter((page) => {
          if (page.lastmod === undefined) return true;

          if (isValidDate(onlyEditedSinceDate)) {
            return now > onlyEditedSinceDate;
          }

          if (Number.isInteger(onlyEditedLastNSeconds)) {
            const diff = Math.abs(
              Math.floor(
                (now.getTime() - new Date(page.lastmod).getTime()) / 1000
              )
            );
            return diff < (onlyEditedLastNSeconds as number);
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
