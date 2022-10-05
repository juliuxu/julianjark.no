import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { createRemixContext } from "~/remix-context.server";

export const handle = {
  hello: "👋",
};

export const loader = ({ request }: LoaderArgs) => {
  return json(createRemixContext(request));
};
