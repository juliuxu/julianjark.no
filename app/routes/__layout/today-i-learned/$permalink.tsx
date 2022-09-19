import { useEffect } from "react";
import type { HeadersFunction, MetaFunction } from "@remix-run/node";
import { useLocation, useParams } from "@remix-run/react";

import { getTextFromRichText, slugify } from "~/notion/notion";
import type { Loader as TodayILearnedLoader } from "~/routes/__layout/today-i-learned";
import { assertItemFound } from "~/utils";

/**
 * Display nice OG and twitter meta tags
 */
export const meta: MetaFunction<
  {},
  {
    "routes/__layout/today-i-learned": TodayILearnedLoader;
  }
> = ({ params, parentsData }) => {
  const entry = parentsData["routes/__layout/today-i-learned"].entries.find(
    (x) => params.permalink === slugify(x.title),
  );
  assertItemFound(entry);

  // Get first paragraph and use as description
  // TODO: Use multiple paragraphs as longs the count is less than a limit
  const description = entry.notionBlocks
    .filter((x) => x.type === "paragraph")
    .slice(0, 2)
    .map((p) =>
      p.type === "paragraph" ? getTextFromRichText(p.paragraph.rich_text) : "",
    )
    .join(".\n")
    .replace(/([^.])\.\.\n/, "$1. ");

  return {
    title: entry.title,
    description: description,
    keywords: entry.tags.map((x) => x.title).join(", "),
    "og:title": entry.title,
    "og:type": "article",
    "og:description": description,

    // According to twitter, there is no need to duplicate Open Grap
    // attributes
    // "twitter:title": entry.title,
    // "twitter:description": description,

    "twitter:card": "summary",
  };
};

export const headers: HeadersFunction = ({ parentHeaders }) => parentHeaders;

/**
 * Make sure the linked Entry is selected when first loading the page
 */
export default function TodayILearnedPermalink() {
  const { permalink } = useParams();
  const { key } = useLocation();

  useEffect(() => {
    const element = document.getElementById(permalink ?? "");
    if (!element) return;
    element.scrollIntoView({
      block: "start",
      behavior: "auto",
    });
  }, [key, permalink]);
  return null;
}
