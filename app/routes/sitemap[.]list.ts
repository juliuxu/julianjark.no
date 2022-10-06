import type { LoaderArgs } from "@remix-run/server-runtime";

import config from "~/config";
import { getJulianSitemapEntries } from "~/sitemap.server";

export const loader = async ({ request }: LoaderArgs) => {
  const sitemapEntries = await getJulianSitemapEntries(request);
  const urlList = sitemapEntries.map((x) => `${config.baseUrl}${x.path}`);
  return new Response(urlList.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      encoding: "UTF-8",
    },
  });
};
