import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/server-runtime";

import { getTextFromRichText } from "~/notion/notion";
import { getTodayILearnedEntries } from "~/notion/notion";
import { getBlocksWithChildren } from "~/notion/notion-api.server";
import { socialImageUrlBuilder } from "~/utils";
import { prepareTodayILearendEntry } from "../__layout/today-i-learned";
import { notionSelectColors } from "../__layout/today-i-learned/$permalink";

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
      ingress: entry.notionBlocks
        .filter((x) => x.type === "paragraph")
        .slice(0, 1)
        .map((p) =>
          p.type === "paragraph"
            ? getTextFromRichText(p.paragraph.rich_text)
            : "",
        )
        .join(""),
      tags: entry.tags.map((x) => ({
        title: x.title,
        color: notionSelectColors[x.color],
      })),
      author: "Julian Jark",
    }),
  );

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 8 }}>
      {imageUrls.map((x) => (
        <img
          key={x}
          style={{ objectFit: "scale-down", maxWidth: "100%" }}
          alt=""
          src={x.toString()}
        />
      ))}
    </div>
  );
}
