import { LinksFunction } from "@remix-run/node";
import picoCss from "@picocss/pico/css/pico.min.css";
import { useEffect, useRef, useState } from "react";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: picoCss,
  },
];

export default function CachePurgeWatcher() {
  const [buffer, setBuffer] = useState("");
  const abortController = useRef<AbortController | null>(null);
  const [isWatching, setIsWatching] = useState(false);
  const [watchInterval, setWatchInterval] = useState(15000);
  const [loglevel, setLoglevel] = useState<"silent" | "info" | "verbose">(
    "silent"
  );

  useEffect(() => {
    abortController?.current?.abort();
    setBuffer("");

    if (isWatching) {
      (async () => {
        abortController.current = new AbortController();
        try {
          const response = await fetch(
            `/api/cache-purge-watcher-stream?loglevel=${loglevel}&watchInterval=${watchInterval}`,
            {
              signal: abortController.current.signal,
            }
          );
          const reader = response.body
            ?.pipeThrough(new TextDecoderStream())
            .getReader();
          if (!reader) throw new Error("no reader available");

          while (true) {
            const { done, value } = await reader.read();
            if (done || abortController.current.signal.aborted) return;
            if (value) {
              setBuffer((currentBuffer) => {
                const newBuffer = currentBuffer + value;
                // const split = newBuffer.split("\n\n");
                // if (split.length > 1) return split[1];
                return newBuffer;
              });
            }
          }
        } catch (e) {}
      })();
    }
  }, [isWatching, loglevel, watchInterval]);
  const selectStyle = {
    width: "unset",
    padding: "0 1.5rem 0 1rem",
    marginBottom: 0,
  };
  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-start", gap: 8 }}>
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
        <select
          style={selectStyle}
          value={loglevel}
          onChange={(e) => setLoglevel(e.target.value as any)}
        >
          <option value="silent">silent</option>
          <option value="info">info</option>
          <option value="verbose">verbose</option>
        </select>
        <select
          style={selectStyle}
          value={watchInterval}
          onChange={(e) => setWatchInterval(Number(e.target.value) as any)}
        >
          <option value="5000">5s</option>
          <option value="15000">15s</option>
          <option value="30000">30s</option>
          <option value="60000">60s</option>
        </select>
      </div>
      {isWatching && (
        <pre
          // https://stackoverflow.com/a/44051405
          style={{
            height: 100,
            display: "flex",
            flexDirection: "column-reverse",
          }}
        >
          {buffer}
        </pre>
      )}
    </>
  );
}
