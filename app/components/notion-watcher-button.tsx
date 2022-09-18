import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@remix-run/react";

import config from "~/config";
import { useShortcut } from "./use-shortcut";

type Props = {
  watchInterval?: number;
  onUpdate?: () => void;
} & (
  | { pageId: string; databaseId: undefined }
  | { pageId: undefined; databaseId: string }
);

export const useNotionWatcher = (
  active: boolean,
  {
    pageId,
    databaseId,
    watchInterval,
    onUpdate = () => window.location.reload(),
  }: Props,
) => {
  useEffect(() => {
    if (!active) return;
    const url = new URL(`/api/notion-watcher`, config.baseUrl);
    pageId && url.searchParams.append("pageId", pageId);
    databaseId && url.searchParams.append("databaseId", databaseId);
    if (watchInterval)
      url.searchParams.append("watchInterval", String(watchInterval));

    const eventSource = new EventSource(url);
    eventSource.addEventListener("fetch", () => {});
    eventSource.addEventListener("update", onUpdate);
    return () => {
      eventSource.close();
    };
  }, [active, pageId, watchInterval]);
};

export const NotionWatcherButton = (props: Props) => {
  const [isActive, setIsActive] = useState(false);
  const toggleActive = useCallback(() => setIsActive((x) => !x), []);
  const revalidate = useRevalidate();
  useNotionWatcher(isActive, { ...props, onUpdate: revalidate });

  useShortcut("w", toggleActive);
  return (
    <button type="button" onClick={toggleActive} className="text-3xl">
      <div className={`${isActive && "animate-pulse"}`}>⎈</div>
    </button>
  );
};

// Based on https://sergiodxa.com/articles/automatic-revalidation-in-remix
function useRevalidate() {
  // We get the navigate function from React Rotuer
  let navigate = useNavigate();
  // And return a function which will navigate to `.` (same URL) and replace it
  return useCallback(
    async function revalidate() {
      const url = new URL(window.location.href);
      document.cookie = "no_cache=1;max-age=15";
      await fetch(`/api/purge-notion-cache`, { method: "DELETE" });
      navigate(url.pathname + url.search, { replace: true });
    },
    [navigate],
  );
}
