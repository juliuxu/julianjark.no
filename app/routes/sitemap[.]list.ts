import { LoaderFunction } from "@remix-run/node";
import { asUrlList, getSitemapTree } from "~/sitemap.server";

export const loader: LoaderFunction = async () => {
  const sitemapTree = await getSitemapTree();
  const urlList = asUrlList(sitemapTree);

  return new Response(urlList.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      encoding: "UTF-8",
    },
  });
};
