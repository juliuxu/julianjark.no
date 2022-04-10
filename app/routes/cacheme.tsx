import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader() {
  await new Promise((r) => setTimeout(r, 1000));
  return json({ time: new Date().toTimeString() });
}

export default function CacheMe() {
  const { time } = useLoaderData();
  return (
    <main>
      <h1>Cache me Please</h1>
      <code>{time}</code>
    </main>
  );
}

// Cache ⚡️
// using stale-while-revalidate
// Users will always get fast responses
// It will take 1 minute for updates to appear
// Adding proxy_cache_bypass allows us to manually invalidate the cache
// by hitting an endpoint `Cache-Purge: true`
//
// curl "https://julianjark.no/cacheme" -H 'Cache-Purge: 1' -I
const nginxConfig = `
proxy_cache public-cache;
proxy_cache_key $host$request_uri;
proxy_cache_valid 200 1m;
proxy_cache_use_stale updating error timeout http_500 http_502 http_503 http_504;
proxy_cache_background_update on;
proxy_cache_bypass $http_cache_purge;
add_header X-Cache-Status $upstream_cache_status;
proxy_ignore_headers Vary;
`;
