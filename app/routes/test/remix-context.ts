import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";

import { createRemixContext } from "~/packages/remix-sitemap/remix-context.server";

export const handle = {
  hello: "👋",
};

export const loader = ({ request }: LoaderArgs) => {
  return json(createRemixContext(request));
};
