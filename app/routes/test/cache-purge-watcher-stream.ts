import { LoaderFunction } from "@remix-run/node";
import { getBooleanOrUndefined, getOneOfOrUndefined } from "~/common";
import config from "~/config.server";
import { flattenDepthFirst, getSitemapTree, Page } from "../sitemap";

// Notion date stamps are by the minute
// Only other way to purge then is by checking changes in other properties
const WATCH_INTERVAL = 70 * 1000;

const isChangedPage = (before: Date) => (page: Page) => {
  return new Date(page.lastmod) > before;
};

const purgePage = (page: Page) => {
  const paths = [
    page.path,
    `${page.path}?_data=${encodeURIComponent(page.codePath)}`,
  ];
  const requests = paths.map((path) =>
    fetch(`${config.baseUrl}${path}`, {
      headers: { "Cache-Purge": "1" },
    })
  );
  return Promise.allSettled(requests);
};

export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url);

  // Handle logging to the client
  const currentLoglevel =
    getOneOfOrUndefined(
      ["silent", "info", "verbose"],
      url.searchParams.get("loglevel")
    ) ?? "verbose";
  const loglevelStringToInt: Record<typeof currentLoglevel, number> = {
    silent: 0,
    info: 1,
    verbose: 2,
  };

  const stream = new ReadableStream({
    async start(controller) {
      const logToClient = (
        message: string,
        loglevel: typeof currentLoglevel
      ) => {
        if (
          loglevelStringToInt[currentLoglevel] >= loglevelStringToInt[loglevel]
        ) {
          controller.enqueue(message);
          if (!message.endsWith("\n")) controller.enqueue("\n");
        }
      };

      let before = new Date();
      before.setMilliseconds(before.getMilliseconds() - WATCH_INTERVAL);
      while (!request.signal.aborted) {
        // Fetch sitemap
        logToClient("🌍 fetching sitemap", "info");
        const now = new Date();
        const pages = flattenDepthFirst(await getSitemapTree());

        // Verbose log sorted timestamps
        logToClient(`b ${before.toISOString()}`, "verbose");
        pages
          .slice()
          .sort(
            (a, b) =>
              new Date(b.lastmod).valueOf() - new Date(a.lastmod).valueOf()
          )
          .forEach((page) => {
            logToClient(`: ${page.lastmod} ${page.path}`, "verbose");
          });

        // Get changed pages
        const changedPages = pages.filter(isChangedPage(before));

        // Log which pages are updating
        changedPages.forEach((page) => {
          logToClient(`🔥 updating ${page.path} (${page.title})`, "silent");
        });
        if (changedPages.length === 0) {
          currentLoglevel && logToClient("🆗 no pages updated", "info");
        }

        // Purge the pages
        await Promise.allSettled(changedPages.flatMap(purgePage));
        changedPages.length > 0 && logToClient("✅ done", "info");

        // Sleep till next watch
        before = now;
        await new Promise((r) => setTimeout(r, WATCH_INTERVAL));
        (currentLoglevel || changedPages.length > 0) &&
          controller.enqueue("\n");
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "cache-control": "no-store", "content-type": "plain/text" },
  });
};

// 14:00:01 -> 🔥 -> update (14:00:40) -> 14:01:10
