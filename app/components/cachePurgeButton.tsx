import { useFetcher } from "@remix-run/react";
import { useState } from "react";

export function CachePurgeCurrentPageButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const onClick = async () => {
    setIsSubmitting(true);
    await fetch(window.location.href, {
      method: "HEAD",
      headers: { "Cache-Purge": "1" },
    });
    setIsSubmitting(false);
    window.location.reload();
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="secondary outline"
      disabled={isSubmitting}
      aria-busy={isSubmitting}
    >
      {!isSubmitting && "↻"}
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
