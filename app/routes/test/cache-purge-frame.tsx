import { LinksFunction } from "@remix-run/node";
import picoCss from "@picocss/pico/css/pico.min.css";
import { CachePurgeAllPagesButton } from "~/components/cachePurgeButton";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: picoCss,
  },
];

export default function CachePurgeFrame() {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <CachePurgeAllPagesButton onlyEditedLastNSeconds={60 * 60}>
        ⏱ Last hour
      </CachePurgeAllPagesButton>
      <CachePurgeAllPagesButton onlyEditedLastNSeconds={60 * 60 * 24 * 7}>
        📆 Last week
      </CachePurgeAllPagesButton>
      <CachePurgeAllPagesButton>🔥☠️🔥</CachePurgeAllPagesButton>
    </div>
  );
}
