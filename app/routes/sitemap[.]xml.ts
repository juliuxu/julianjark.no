import type { LoaderArgs } from "@remix-run/node";

import config from "~/config";
import type { SitemapEntry } from "~/packages/remix-sitemap/sitemap.server";
import { getJulianSitemapEntries } from "~/sitemap.server";

function toXmlEntry({ path, lastmod, changefreq, priority }: SitemapEntry) {
  return `
  <url>
    <loc>${config.baseUrl}${path}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    ${changefreq ? `<changefreq>${changefreq}</changefreq>` : ""}
    ${priority ? `<priority>${priority}</priority>` : ""}
  </url>
    `.trim();
}

export const loader = async ({ request }: LoaderArgs) => {
  const sitemapEntries = await getJulianSitemapEntries(request);

  const sitemapXmlContent = sitemapEntries.map(toXmlEntry);
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
>
    ${sitemapXmlContent}
</urlset>
`,
    {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "xml-version": "1.0",
        encoding: "UTF-8",
      },
    },
  );
};
