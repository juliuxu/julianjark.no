import { LoaderFunction } from "@remix-run/node";
import { flattenDepthFirst, getSitemapTree } from "./sitemap";
import type { Page } from "./sitemap";
import config from "~/config.server";

function pageToEntry(page: Page): string {
  return `
  <url>
    <loc>${`${config.baseUrl}${page.path}`}</loc>
  </url>`;
  /*
      <lastmod>${today}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.7</priority>
*/
}

export const loader: LoaderFunction = async () => {
  const sitemapTree = await getSitemapTree();
  const sitemapContent = flattenDepthFirst(sitemapTree)
    .map(pageToEntry)
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd"
>
    ${sitemapContent}
</urlset>
`,
    {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "xml-version": "1.0",
        encoding: "UTF-8",
      },
    }
  );
};
