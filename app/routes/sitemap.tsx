import { useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";

import Code from "~/components/prism-code";
import { getJulianSitemapEntries } from "~/sitemap.server";

export const loader = async ({ request }: LoaderArgs) => {
  const sitemapTree = await getJulianSitemapEntries(request);
  return json({ sitemapTree });
};

export default function Sitemap() {
  const data = useLoaderData<typeof loader>();
  return <Code code={JSON.stringify(data, null, 2)} language="json" />;
}
