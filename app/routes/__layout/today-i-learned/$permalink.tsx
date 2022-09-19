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

  // Get firsßt paragraph and use as description
  // TODO: Use multiple paragraphs as longs the count is less than a limit
  const description = entry.notionBlocks
    .filter((x) => x.type === "paragraph")
    .slice(0, 2)
    .map((p) =>
      p.type === "paragraph" ? getTextFromRichText(p.paragraph.rich_text) : "",
    )
    .join(".\n")
    .replace(/([^.])\.\.\n/, "$1. ");

  const tags = entry.tags.map((x) => x.title);

  return {
    title: entry.title,
    description: description,
    "og:title": entry.title,
    "og:description": description,

    // TODO: Generate an image of the article 🤯
    // use last updated time in url to ensure
    // "og:image": "",

    // According to twitter, there is no need to duplicate Open Grap
    // attributes
    // "twitter:title": entry.title,
    // "twitter:description": description,

    "twitter:card": "summary",

    "twitter:label1": "Publisert",
    "twitter:data1": new Intl.DateTimeFormat("no-nb", {
      dateStyle: "medium",
    }).format(new Date(entry.created)),

    "twitter:label2": "Tags",
    "twitter:data2": tags.join(", "),

    // Extra, unsure about the effect
    "og:type": "article",
    "article:tag": tags,

    keywords: tags.join(", "),
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
