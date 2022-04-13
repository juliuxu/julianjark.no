import { LoaderFunction, json } from "@remix-run/node";
import { getSitemapTree } from "./sitemap";

export const loader: LoaderFunction = async ({ request }) => {
  const sitemapTree = await getSitemapTree();
  return json(sitemapTree);
};
