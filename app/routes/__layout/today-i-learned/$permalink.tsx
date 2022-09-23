import { useEffect } from "react";
import type { HeadersFunction, MetaFunction } from "@remix-run/node";
import { useLocation, useParams } from "@remix-run/react";

import { getTextFromRichText, slugify } from "~/notion/notion";
import type { SelectColor } from "~/notion/notion.types";
import type { Loader as TodayILearnedLoader } from "~/routes/__layout/today-i-learned";
import { socialImageUrlBuilder } from "~/routes/api/social-image";
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

  const image = socialImageUrlBuilder({
    headline: "I dag lærte jeg",
    title: entry.title,
    tags: entry.tags.map((x) => ({
      title: x.title,
      color: notionSelectColors[x.color],
    })),
    ingress: description,
    author: "Julian Jark",
  });

  return {
    title: entry.title,
    description: description,
    "og:title": entry.title,
    "og:description": description,

    "og:image": image,
    "twitter:card": image ? "summary_large_image" : "summary",

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
    "og:type": "article",
    "article:tag": tags,
    keywords: tags.join(", "),

    // Linkedin complained about this
    author: "Julian Jark",
    "article:byline": "Julian Jark",

    // Published date
    publish_date: entry.created,
    "og:publish_date": entry.created,
    "article:published_time": entry.created,
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
  return null;
}

export const notionSelectColors: Record<SelectColor, string> = {
  default: `rgb(243 244 246)`,
  gray: `rgb(209 213 219)`,
  brown: `rgb(253 230 138)`,
  orange: `rgb(254 215 170)`,
  yellow: `rgb(254 240 138)`,
  green: `rgb(187 247 208)`,
  blue: `rgb(191 219 254)`,
  purple: `rgb(88 28 135)`,
  pink: `rgb(231 44 127)`,
  red: `rgb(227 49 49)`,
};
