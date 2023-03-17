import { useEffect } from "react";
import type { HeadersFunction, V2_MetaFunction } from "@remix-run/node";
import { useLocation, useParams } from "@remix-run/react";

import {
  getTextFromRichText,
  getTodayILearnedEntries,
  slugify,
} from "~/notion/notion";
import type { SelectColor } from "~/notion/notion.types";
import type { SitemapHandle } from "~/packages/remix-sitemap/sitemap.server";
import type { Loader as TodayILearnedLoader } from "~/routes/_layout/today-i-learned/route";
import { databaseEntryToSitemapEntry } from "~/sitemap.server";
import { assertItemFound, socialImageUrlBuilder } from "~/utils";

export const handle: SitemapHandle = {
  getSitemapEntries: async () =>
    (await getTodayILearnedEntries()).map(databaseEntryToSitemapEntry),
};

/**
 * Display nice OG and twitter meta tags
 */
export const meta: V2_MetaFunction<
  {},
  {
    "routes/_layout/today-i-learned": TodayILearnedLoader;
  }
> = ({ params, parentsData }) => {
  const entry = parentsData["routes/_layout/today-i-learned"].entries.find(
    (x) => params.permalink === slugify(x.title),
  );
  assertItemFound(entry);

  // Get first paragraph and use as description/ingress
  // TODO: Use multiple paragraphs as longs the count is less than a limit
  const description = entry.notionBlocks
    .filter((x) => x.type === "paragraph")
    .slice(0, 1)
    .map((p) =>
      p.type === "paragraph" ? getTextFromRichText(p.paragraph.rich_text) : "",
    )
    .join(".\n")
    .replace(/([^.])\.\.\n/, "$1. ");

  const tags = entry.tags.map((x) => x.title);

  let image = socialImageUrlBuilder({
    headline: "I dag lærte jeg",
    title: entry.title,
    tags: entry.tags.map((x) => ({
      title: x.title,
      color: notionSelectColors[x.color],
    })),
    ingress: description,
    author: "Julian Jark",
  });
  // Version hack
  image += "&v=2";

  return [
    {
      title: entry.title,
    },
    { name: "description", property: "og:description", content: description },
    { property: "og:title", content: entry.title },
    { property: "og:description", content: description },

    { property: "og:image", content: image },
    {
      name: "twitter:card",
      content: image ? "summary_large_image" : "summary",
    },

    // According to twitter, there is no need to duplicate Open Grap
    // attributes
    // "twitter:title": entry.title,
    // "twitter:description": description,

    // Extra tags displayed in slack
    // TODO: Add published date in og:image
    // "twitter:label1": "Publisert",
    // "twitter:data1": new Intl.DateTimeFormat("no-nb", {
    //   dateStyle: "medium",
    // }).format(new Date(entry.created)),

    // "twitter:label2": "Tags",
    // "twitter:data2": tags.join(", "),

    // Extra, unsure about the effect
    { property: "og:type", content: "article" },
    { name: "keywords", content: tags.join(", ") },
    ...tags.map((tag) => ({ property: "article:tag", content: tag })),

    // Linkedin complained about this
    { name: "author", content: "Julian Jark" },
    { property: "article:byline", content: "Julian Jark" },

    // Published date
    { name: "publish_date", content: entry.created },
    { property: "og:publish_date", content: entry.created },
    { property: "article:published_time", content: entry.created },
  ];
};

export const headers: HeadersFunction = ({ parentHeaders }) => parentHeaders;

/**
 * Make sure the linked Entry is selected when first loading the page
 */
export default function TodayILearnedPermalink() {
  const { permalink } = useParams();
  const { key } = useLocation();

  useEffect(() => {
    console.log(
      "og:image",
      (document.querySelector(`meta[property="og:image"]`) as any)?.content,
    );
    const element = document.getElementById(permalink ?? "");
    if (!element) return;
    element.scrollIntoView({
      block: "start",
      behavior: "auto",
    });
  }, [key, permalink]);

  return (
    <script
      // Add an inline script to make sure the scroll happens immediately
      // on slow networks, before hydration.
      dangerouslySetInnerHTML={{
        __html: `
        document.addEventListener('DOMContentLoaded', () => {
          const element = document.getElementById("${permalink}");
          element && element.scrollIntoView({
            block: "start",
            behavior: "auto",
          });
        });
    `,
      }}
    />
  );
}

export const notionSelectColors: Record<SelectColor, string> = {
  default: `rgb(243 244 246)`,
  gray: `rgb(209 213 219)`,
  brown: `rgb(253 230 138)`,
  orange: `rgb(254 215 170)`,
  yellow: `rgb(254 240 138)`,
  green: `rgb(187 247 208)`,
  blue: `rgb(191 219 254)`,
  purple: `#c084fc`,
  pink: `rgb(231 44 127)`,
  red: `rgb(227 49 49)`,
};
