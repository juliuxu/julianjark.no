import { useCallback, useEffect, useRef, useState } from "react";
import { useFetcher } from "@remix-run/react";

export const useShortcut = (keys: string, onTrigger: () => unknown) => {
  const pressedKeysRef = useRef("");
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    pressedKeysRef.current += event.key;
    if (pressedKeysRef.current === keys) {
      pressedKeysRef.current = "";
      onTrigger();
    } else if (!keys.startsWith(pressedKeysRef.current)) {
      // Reset when the combination is no longer matching
      pressedKeysRef.current = "";
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);
};

export function CachePurgeCurrentPageButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reloadWithoutCache = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    document.cookie = "no_cache=1;max-age=15";
    window.location.reload();
  };
  useShortcut("rr", reloadWithoutCache);
  return (
    <button
      type="button"
      onClick={reloadWithoutCache}
      className="text-3xl"
      disabled={isSubmitting}
      aria-busy={isSubmitting}
    >
      <div className="rotate-90">↻</div>
    </button>
  );
}

export function CachePurgeAllPagesButton({
  onlyEditedLastNSeconds,
  children = "🔥",
}: {
  onlyEditedLastNSeconds?: number;
  children?: React.ReactNode;
}) {
  const cachePurge = useFetcher();
  const isSubmitting = cachePurge.state === "submitting";
  return (
    <cachePurge.Form
      method="post"
      action={
        onlyEditedLastNSeconds
          ? `/api/cache-purge?onlyEditedLastNSeconds=${onlyEditedLastNSeconds}`
          : "/api/cache-purge"
      }
    >
      <button
        type="submit"
        className="secondary outline"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {!isSubmitting && children}
      </button>
    </cachePurge.Form>
  );
}
