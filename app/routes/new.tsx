import type { LinksFunction } from "@remix-run/node";

import globalCss from "~/global.css";
import tailwind from "~/tailwind.css";
export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: tailwind,
  },
  {
    rel: "stylesheet",
    href: globalCss,
  },
];
