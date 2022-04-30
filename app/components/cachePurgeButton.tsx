import { useFetcher } from "@remix-run/react";
import { isDebugMode, OnlyDebugMode } from "./debug";

export default function CachePurgeButton() {
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
          className="contrast outline"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {!isSubmitting && "🔥"}
        </button>
      </cachePurge.Form>
    </OnlyDebugMode>
  );
}
