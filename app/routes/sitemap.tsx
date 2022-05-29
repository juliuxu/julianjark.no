import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Code from "~/components/prism-code";
import { getSitemapTree, asUrlList } from "~/sitemap.server";

export const loader: LoaderFunction = async () => {
  const sitemapTree = await getSitemapTree();
  return json({ sitemapTree, urlList: asUrlList(sitemapTree) });
};

export default function Sitemap() {
  const data = useLoaderData();
  return <Code code={JSON.stringify(data, null, 2)} language={"json"} />;
}
