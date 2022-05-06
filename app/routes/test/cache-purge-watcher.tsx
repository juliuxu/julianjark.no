import { LinksFunction } from "@remix-run/node";
import picoCss from "@picocss/pico/css/pico.min.css";
import { useEffect, useRef, useState } from "react";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: picoCss,
  },
];

const interval = 10000;

export default function CachePurgeWatcher() {
  const [buffer, setBuffer] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const [isWatching, setIsWatching] = useState(false);

  const stopWatching = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
  useEffect(() => {
    stopWatching();
    if (!isWatching) return;

    let before = new Date();
    const watcher = async () => {
      const now = new Date();
      const searchParams = new URLSearchParams();
      searchParams.set("onlyEditedSinceDate", before.toISOString());
      const response = await fetch(`/api/cache-purge?${searchParams}`, {
        method: "POST",
      });
      const body = await response.text();
      setBuffer(body);
    };

    intervalRef.current = setInterval(watcher, interval);
    return stopWatching;
  }, [isWatching]);

  return (
    <>
      <label>
        Watch{" "}
        <input
          type="checkbox"
          role="switch"
          checked={isWatching}
          onChange={() => {
            setIsWatching(!isWatching);
          }}
        />
      </label>
      {isWatching && <pre>{buffer}</pre>}
    </>
  );
}
