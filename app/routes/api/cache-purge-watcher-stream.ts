import { LoaderFunction } from "@remix-run/node";
import { getNumberOrUndefined, getOneOfOrUndefined } from "~/utils";
import { createReadableStreamLogger, purgeUpdatedPages } from "./cache-purge";

const DEFAULT_WATCH_INTERVAL = 20 * 1000;
export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url);
  const currentLoglevel =
    getOneOfOrUndefined(
      ["silent", "info", "verbose"],
      url.searchParams.get("loglevel")
    ) ?? "info";
  const watchInterval = Math.max(
    getNumberOrUndefined(url.searchParams.get("watchInterval")) ??
      DEFAULT_WATCH_INTERVAL,
    4000
  );

  const stream = new ReadableStream({
    async start(controller) {
      const logger = createReadableStreamLogger(controller, currentLoglevel);

      let before = new Date();
      before.setMilliseconds(before.getMilliseconds() - watchInterval);
      while (!request.signal.aborted) {
        const now = new Date();
        const purgedPages = await purgeUpdatedPages(before, logger);
        before = now;
        await new Promise((r) => setTimeout(r, watchInterval));
        (currentLoglevel || purgedPages.length > 0) && controller.enqueue("\n");
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "cache-control": "no-store", "content-type": "plain/text" },
  });
};
