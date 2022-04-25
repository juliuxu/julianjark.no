import { json, LinksFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import picoCss from "@picocss/pico/css/pico.min.css";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: picoCss,
  },
];

export async function loader() {
  await new Promise((r) => setTimeout(r, 1000));
  return json({ time: new Date().toTimeString() });
}

export default function CacheMe() {
  const { time } = useLoaderData();
  return (
    <main className="container">
      <h1>Cache me Please</h1>
      <code>{time}</code>
    </main>
  );
}

/**
 * Caching
 *
 * Cache with  ⚡️
 * using stale-while-revalidate
 * Users will always get fast responses
 * It will take 1 minute for updates to appear
 * Adding proxy_cache_bypass allows us to manually invalidate the cache
 * by hitting an endpoint `Cache-Purge: true`
 *
 * curl "https://julianjark.no/cacheme" -H 'Cache-Purge: 1' -I
 */
const nginxConfig = `
# Server caching

## This must be directely inside the http block of the configuration
proxy_cache_path /var/lib/nginx/cache/super levels=1:2 keys_zone=super-cache:30m max_size=1024m inactive=1y;

proxy_cache super-cache;
proxy_cache_key $host$request_uri;
proxy_cache_valid 200 1m;
proxy_cache_use_stale updating error timeout http_500 http_502 http_503 http_504;
proxy_cache_background_update on;
proxy_cache_bypass $http_cache_purge;
add_header X-Cache-Status $upstream_cache_status;
proxy_ignore_headers Vary;

# Browser caching
etag on;

`;

const onlyNginxConfig = `
location / {
  include conf.d/include/proxy.conf;
  
  proxy_cache super-cache;
  proxy_cache_key $host$request_uri;
  proxy_cache_valid 200 1m;
  proxy_cache_use_stale updating error timeout http_500 http_502 http_503 http_504;
  proxy_cache_background_update on;
  proxy_cache_bypass $http_cache_purge;
  add_header X-Cache-Status $upstream_cache_status;
  proxy_ignore_headers Vary;
}
`;

const cacheEnabledButControlledByApp = `
location / {
  include conf.d/include/proxy.conf;
  
  proxy_cache super-cache;
  proxy_cache_key $host$request_uri;
  proxy_cache_background_update on;
  proxy_cache_bypass $http_cache_purge;
  add_header X-Cache-Status $upstream_cache_status;
  proxy_ignore_headers Vary;
}
`;
