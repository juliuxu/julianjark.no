import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { getTodayILearnedEntries } from "~/notion/notion";
import { getBlocksWithChildren } from "~/notion/notion-api.server";
import { prepareTodayILearendEntry } from "../__layout/today-i-learned";
import { notionSelectColors } from "../__layout/today-i-learned/$permalink";
import { socialImageUrlBuilder } from "../api/social-image";

export const loader = async () => {
  const entryPages = await getTodayILearnedEntries();
  const entries = await Promise.all(
    entryPages.map(async (page) => {
      const blocks = await getBlocksWithChildren(page.id);
      return prepareTodayILearendEntry(page, blocks);
    }),
  );
  return json({ entries });
};
export default function SocialImageTest() {
  const { entries } = useLoaderData<typeof loader>();
  const imageUrls = entries.map((entry) =>
    socialImageUrlBuilder({
      headline: "I dag lærte jeg",
      title: entry.title,
      tags: entry.tags.map((x) => ({
        title: x.title,
        color: notionSelectColors[x.color],
      })),
      author: "Julian Jark",
    }),
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {imageUrls.map((x) => (
        <img key={x} style={{ maxWidth: "100%" }} alt="" src={x.toString()} />
      ))}
    </div>
  );
}
