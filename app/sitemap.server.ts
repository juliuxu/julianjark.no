import { getTitle, slugify } from "./notion/notion";
import type { DatabasePage } from "./notion/notion-api.server";
import type {
  SitemapEntry,
  SitemapHandle,
} from "./packages/remix-sitemap/sitemap.server";
import { getSitemapEntries } from "./packages/remix-sitemap/sitemap.server";

export type JulianSitemapEntry = SitemapEntry & {
  title?: string;
};
export type JulianHandle = SitemapHandle<JulianSitemapEntry>;

const sitemapWhitelist = [/^\/$/, /^\/today-i-learned/, /^\/dranks(?!\/meny$)/];
export const getJulianSitemapEntries = async (request: Request) => {
  const sitemapEntries = await getSitemapEntries<
    JulianHandle,
    JulianSitemapEntry
  >(request);
  const filtered = sitemapEntries.filter((page) =>
    sitemapWhitelist.some((r) => r.test(page.path)),
  );
  return filtered;
};

export const databaseEntryToSitemapEntry = (
  entry: DatabasePage,
): Required<Pick<JulianSitemapEntry, "path" | "lastmod" | "title">> => ({
  path: slugify(getTitle(entry)),
  lastmod: entry.last_edited_time,
  title: getTitle(entry),
});
