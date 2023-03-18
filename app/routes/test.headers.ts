import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

export const loader = ({ request }: LoaderArgs) => {
  return json(Object.fromEntries(request.headers));
};
