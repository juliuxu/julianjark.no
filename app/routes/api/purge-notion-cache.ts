import type { ActionFunction } from "@remix-run/node";

import { notionCachePurgeEverything } from "~/notion/notion-api.server";

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "DELETE") throw new Error("only DELETE allowed");
  await notionCachePurgeEverything();
  return new Response("", { status: 204 });
};
