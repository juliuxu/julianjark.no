import type { ActionFunction } from "@remix-run/node";

import config from "~/config";
import { notionCachePurgeEverything } from "~/notion/notion-api.server";
import type { SitemapEntry } from "~/packages/remix-sitemap/sitemap.server";
import { getJulianSitemapEntries } from "~/sitemap.server";
import {
  chunked,
  getDateOrUndefined,
  getNumberOrUndefined,
  getOneOfOrUndefined,
} from "~/utils";

export const isChangedPage = (before: Date) => (page: SitemapEntry) => {
  if (!page.lastmod) return before < new Date(1);

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

export const purgePage = async (page: SitemapEntry, logger: Logger) => {
  const paths = [
    page.path!,
    ...(page.loaderPaths?.map(
      (loaderPath) => `${page.path}?_data=${encodeURIComponent(loaderPath)}`,
    ) ?? []),
  ];
  if (paths.length > 0) {
    paths.forEach((path) => logger(`  ℹ️  ${path}`, "verbose"));
  }
  for (const path of paths) {
    await fetch(`${config.baseUrl}${path}`, {
      headers: { "no-cache": "1" },
    });
  }
};

type Logger = (message: string, level: "silent" | "info" | "verbose") => void;

export const purgeUpdatedPages = async (
  request: Request,
  before: Date,
  logger: Logger,
) => {
  // Fetch sitemap
  logger("🌍 fetching sitemap", "info");
  const sitemapEntries = await getJulianSitemapEntries(request);

  // Verbose log sorted timestamps
  logger(`b ${before.toISOString()}`, "verbose");
  sitemapEntries
    .slice()
    .sort(
      (a, b) => new Date(b.lastmod!).valueOf() - new Date(a.lastmod!).valueOf(),
    )
    .forEach((page) => {
      logger(`: ${page.lastmod} ${page.path}`, "verbose");
    });

  // Get changed pages
  const changedPages = sitemapEntries.filter(isChangedPage(before));

  changedPages.length > 0 &&
    logger(`🔄 ${changedPages.length} pages to update`, "info");

  // Purge the pages
  for (let chunk of chunked(changedPages, 5)) {
    // Log which pages are updating
    chunk.forEach((page) => {
      logger(`🔥 updating ${page.path} (${page.title})`, "info");
    });

    await Promise.allSettled(chunk.flatMap((x) => purgePage(x, logger)));
  }
  changedPages.length === 0 && logger("🆗 no pages updated", "info");
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

// TODO: Rename rebuild
export const action: ActionFunction = async ({ request }) => {
  const url = new URL(request.url);
  const onlyEditedLastNSeconds = getNumberOrUndefined(
    url.searchParams.get("onlyEditedLastNSeconds"),
  );
  const onlyEditedSinceDate = getDateOrUndefined(
    url.searchParams.get("onlyEditedSinceDate"),
  );
  const logLevel =
    getOneOfOrUndefined(
      ["silent", "info", "verbose"],
      url.searchParams.get("logLevel"),
    ) ?? "info";

  await notionCachePurgeEverything();

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
        request,
        before(),
        createReadableStreamLogger(controller, logLevel),
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "cache-control": "no-store", "content-type": "plain/text" },
  });
};
