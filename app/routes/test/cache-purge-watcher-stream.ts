import { LoaderFunction } from "@remix-run/node";
import config from "~/config.server";
import { flattenDepthFirst, getSitemapTree } from "../sitemap";

// Notion date stamps are by the minute
// Only other way to purge then is by checking changes in other properties
const WATCH_INTERVAL = 70 * 1000;

export const loader: LoaderFunction = ({ request }) => {
  const stream = new ReadableStream({
    async start(controller) {
      let before = new Date();
      before.setMilliseconds(before.getMilliseconds() - WATCH_INTERVAL);
      while (!request.signal.aborted) {
        // Fetch sitemap
        const now = new Date();
        const pages = flattenDepthFirst(await getSitemapTree());

        // Get changed pages
        const changedPages = pages.filter(
          (page) => new Date(page.lastmod) > before
        );

        // Log
        changedPages.forEach((page) => {
          controller.enqueue(`updating ${page.path} ${page.lastmod} \n`);
        });

        // Duplicate for _data= paths (used when user is navigating)
        const finalPaths = changedPages.flatMap((page) => [
          page.path,
          `${page.path}?_data=${encodeURIComponent(page.codePath)}`,
        ]);

        // Purge them
        const requests = finalPaths.map((path) =>
          fetch(`${config.baseUrl}${path}`, {
            headers: { "Cache-Purge": "1" },
          })
        );
        await Promise.allSettled(requests);

        // Sleep till next watch
        before = now;
        await new Promise((r) => setTimeout(r, WATCH_INTERVAL));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "cache-control": "no-store", "content-type": "plain/text" },
  });
};
