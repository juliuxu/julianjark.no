import type { ActionFunction } from "@remix-run/node";

import config from "~/config.server";
import type { Page } from "~/sitemap.server";
import { getSitemapTree } from "~/sitemap.server";
import {
  flattenDepthFirst,
  getDateOrUndefined,
  getNumberOrUndefined,
} from "~/utils";

export const isChangedPage = (before: Date) => (page: Page) => {
  // Notion timestamps are stored only to minute precision
  // This means that if a before timestamp is recorded at 14:25:30
  // and a changed happens 10 seconds later, at 14:25:40
  // the change will be recorded as 14:25:00
  // which is less than 14:25:30. Making comparsions using seconds miss the change

  // One way to mitigate this is to treat any change in the same minute as changed
  // This will cause more unnecessary updates, but all updates will be caught.
  // With a watch interval of 20 seconds, we will get at most 2 unnecessary purges
  const minuteDate = new Date(before);
  minuteDate.setMilliseconds(0);
  minuteDate.setSeconds(0);

  return new Date(page.lastmod) >= minuteDate;
};

export const purgePage = (page: Page) => {
  const paths = [
    page.path,
    `${page.path}?_data=${encodeURIComponent(page.codePath)}`,
  ];
  const requests = paths.map((path) =>
    fetch(`${config.baseUrl}${path}`, {
      headers: { "Cache-Purge": "1" },
    }),
  );
  return Promise.allSettled(requests);
};

export const purgeUpdatedPages = async (
  before: Date,
  logger: (message: string, level: "silent" | "info" | "verbose") => void,
) => {
  // Fetch sitemap
  logger("🌍 fetching sitemap", "info");
  const pages = flattenDepthFirst(await getSitemapTree());

  // Verbose log sorted timestamps
  logger(`b ${before.toISOString()}`, "verbose");
  pages
    .slice()
    .sort(
      (a, b) => new Date(b.lastmod).valueOf() - new Date(a.lastmod).valueOf(),
    )
    .forEach((page) => {
      logger(`: ${page.lastmod} ${page.path}`, "verbose");
    });

  // Get changed pages
  const changedPages = pages.filter(isChangedPage(before));

  // Log which pages are updating
  changedPages.forEach((page) => {
    logger(`🔥 updating ${page.path} (${page.title})`, "silent");
  });
  if (changedPages.length === 0) {
    logger("🆗 no pages updated", "info");
  }

  // Purge the pages
  await Promise.allSettled(changedPages.flatMap(purgePage));
  changedPages.length > 0 && logger("✅ done", "info");

  return changedPages;
};

export const createReadableStreamLogger = (
  controller: ReadableStreamController<any>,
  currentLoglevel: "silent" | "info" | "verbose",
) => {
  const loglevelStringToInt: Record<typeof currentLoglevel, number> = {
    silent: 0,
    info: 1,
    verbose: 2,
  };
  return function readableStreamLogger(
    message: string,
    loglevel: typeof currentLoglevel,
  ) {
    if (loglevelStringToInt[currentLoglevel] >= loglevelStringToInt[loglevel]) {
      controller.enqueue(message);
      if (!message.endsWith("\n")) controller.enqueue("\n");
    }
  };
};

export const action: ActionFunction = async ({ request }) => {
  const url = new URL(request.url);
  const onlyEditedLastNSeconds = getNumberOrUndefined(
    url.searchParams.get("onlyEditedLastNSeconds"),
  );
  const onlyEditedSinceDate = getDateOrUndefined(
    url.searchParams.get("onlyEditedSinceDate"),
  );

  const before = () => {
    if (onlyEditedSinceDate) {
      return onlyEditedSinceDate;
    }
    if (onlyEditedLastNSeconds) {
      const date = new Date();
      date.setSeconds(-onlyEditedLastNSeconds);
      return date;
    }

    // Everything, i.e. 1970-01-01T00:00:00.000Z
    return new Date(0);
  };

  const stream = new ReadableStream({
    async start(controller) {
      await purgeUpdatedPages(
        before(),
        createReadableStreamLogger(controller, "info"),
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "cache-control": "no-store", "content-type": "plain/text" },
  });
};
