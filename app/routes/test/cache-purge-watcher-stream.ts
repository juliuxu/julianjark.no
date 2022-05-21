import { LoaderFunction } from "@remix-run/node";
import { getOneOfOrUndefined } from "~/common";
import config from "~/config.server";
import { flattenDepthFirst, getSitemapTree, Page } from "../sitemap";

// Notion date stamps are by the minute
// Only other way to purge then is by checking changes in other properties
const WATCH_INTERVAL = 20 * 1000;

const isChangedPage = (before: Date) => (page: Page) => {
  // Notion timestamps are stored only to minute precision
  // This means that if a before timestamp is recorded at 14:25:30
  // and a changed happens 10 seconds later, at 14:25:40
  // the change will be recorded as 14:25:00
  // which is less than 14:25:30. Making a simple comparsion miss the change

  // One way to mitigate this is to treat any change in the same minute as changed
  // This will cause more unnecessary updates, but all updates will be caught.
  // With a watch interval of 20 seconds, we will get at most 2 unnecessary purges
  const minuteDate = new Date(before);
  minuteDate.setMilliseconds(0);
  minuteDate.setSeconds(0);

  return new Date(page.lastmod) >= minuteDate;
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
