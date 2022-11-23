import { CachePurgeAllPagesButton } from "~/components/cache-purge-button";

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
