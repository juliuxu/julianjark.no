import type { LoaderFunction } from "@remix-run/node";

import {
  getDatabasePagesNoCache,
  getPageNoCache,
} from "~/notion/notion-api.server";
import { getNonEmptyStringOrUndefined, getNumberOrUndefined } from "~/utils";

const MIN_WATCH_INTERVAL = 5000;
export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url);
  const pageId = getNonEmptyStringOrUndefined(url.searchParams.get("pageId"));
  const databaseId = getNonEmptyStringOrUndefined(
    url.searchParams.get("databaseId"),
  );
  if (!pageId && !databaseId) return null;

  let watchInterval =
    getNumberOrUndefined(url.searchParams.get("watchInterval")) ??
    MIN_WATCH_INTERVAL;
  if (watchInterval < MIN_WATCH_INTERVAL) watchInterval = MIN_WATCH_INTERVAL;

  // Start watching
  const stream = new ReadableStream({
    async start(controller) {
      let previousLastEditedTime = new Date();
      previousLastEditedTime.setMilliseconds(
        previousLastEditedTime.getMilliseconds() - watchInterval,
      );
      while (!request.signal.aborted) {
        controller.enqueue("event: fetch\ndata:\n\n");

        let last_edited_time;
        if (pageId)
          last_edited_time = await (
            await getPageNoCache(pageId)
          ).last_edited_time;
        else if (databaseId) {
          const entries = await getDatabasePagesNoCache(databaseId, [
            { timestamp: "last_edited_time", direction: "descending" },
          ]);
          last_edited_time = entries
            .map((x) => x.last_edited_time)
            .sort()
            .at(-1)!;
        } else throw new Error("");

        const lastEditedTime = new Date(last_edited_time);

        if (lastEditedTime > previousLastEditedTime) {
          controller.enqueue(`event: update\n`);
          controller.enqueue(
            `data: ${JSON.stringify({
              last_edited_time,
            })}\n\n`,
          );
          previousLastEditedTime = lastEditedTime;
        }

        await new Promise((r) => setTimeout(r, watchInterval));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      connection: "keep-alive",
      "cache-control": "no-store, no-transform",
      "content-type": "text/event-stream",
    },
  });
};

// export default function WatchNotion() {
//   return <div>Hello</div>;
// }
