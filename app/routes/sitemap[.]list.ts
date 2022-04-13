import { LoaderFunction } from "@remix-run/node";
import { asUrlList, getSitemapTree } from "./sitemap";

export const loader: LoaderFunction = async () => {
  const sitemapTree = await getSitemapTree();
  const urlList = await asUrlList(sitemapTree);

  return new Response(urlList.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      encoding: "UTF-8",
    },
  });
};
