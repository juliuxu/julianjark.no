import { LinksFunction } from "@remix-run/node";
import picoCss from "@picocss/pico/css/pico.min.css";
import { CachePurgeAllPagesButton } from "~/components/cachePurgeButton";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: picoCss,
  },
];

export default function CodeTest() {
  return (
    <main className="container">
      <CachePurgeAllPagesButton />
    </main>
  );
}
