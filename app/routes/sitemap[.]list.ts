import { LoaderArgs } from "@remix-run/node";
import { asUrlList, getSitemapTree } from "~/sitemap.server";

export const loader = async ({}: LoaderArgs) => {
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
