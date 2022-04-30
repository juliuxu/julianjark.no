import { useFetcher } from "@remix-run/react";
import { useState } from "react";
import { isDebugMode, OnlyDebugMode } from "./debug";

export function CachePurgeCurrenPageButton() {
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
    <OnlyDebugMode>
      <button
        type="button"
        onClick={onClick}
        className="secondary outline"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
      >
        {!isSubmitting && "↺"}
      </button>
    </OnlyDebugMode>
  );
}

export function CachePurgeAllPagesButton() {
  const cachePurge = useFetcher();
  const isSubmitting = cachePurge.state === "submitting";
  return (
    <OnlyDebugMode>
      <cachePurge.Form
        style={{ display: isDebugMode() ? "unset" : "none" }}
        method="post"
        action="/api/cache-purge"
      >
        <button
          type="submit"
          className="secondary outline"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {!isSubmitting && "🔥"}
        </button>
      </cachePurge.Form>
    </OnlyDebugMode>
  );
}
