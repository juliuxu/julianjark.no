import { useEffect } from "react";
import type { MetaFunction } from "@remix-run/node";
import {
  useLocation,
  useMatches,
  useNavigate,
  useParams,
} from "@remix-run/react";

import { slugify } from "~/notion/notion";
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

  return {
    title: entry.title,
    "og:title": entry.title,
    "twitter:title": entry.title,
  };
};

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
