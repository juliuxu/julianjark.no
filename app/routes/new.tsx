import { LinksFunction } from "@remix-run/node";
import tailwind from "~/tailwind.css";
import globalCss from "~/global.css";
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
