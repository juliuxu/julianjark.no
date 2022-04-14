import { LinksFunction } from "@remix-run/node";
import picoCss from "@picocss/pico/css/pico.classless.min.css";
import commonStyles from "~/styles/common.css";
import { links as codeLinks } from "./components/code";

export const commonLinks: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: picoCss,
  },
  {
    rel: "stylesheet",
    href: commonStyles,
  },

  // Showing code with prismjs
  // For simplicty make this global, for now.
  ...codeLinks(),
];

export function assertItemFound<T>(item: T | undefined): asserts item is T {
  if (item === undefined)
    throw new Response("Not Found", {
      status: 404,
    });
}
