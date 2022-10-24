import { Link, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";

import Debug from "~/components/debug";
import { maybePrepareDebugData } from "~/components/debug.server";
import config from "~/config";
import {
  getBloggEntries,
  getMultiSelectAndColor,
  getSelect,
  getText,
  getTitle,
} from "~/notion/notion";
import type {
  Block,
  BlockWithChildren,
  SelectColor,
} from "~/notion/notion.types";
import type { DatabasePage } from "~/notion/notion-api.server";
import { getOneOfOrUndefined, rewriteNotionImageUrl } from "~/utils";

interface BloggEntry {
  title: string;
  created: string;
  tags: { title: string; color: SelectColor }[];
  ingress: string;
  language: "Norsk" | "Engelsk";
  cover: string;
}
type BloggEntryWithContent = BloggEntry & { notionBlocks: Block[] };

export const prepareBloggEntry = (page: DatabasePage): BloggEntry => {
  let cover = "";
  if (page.cover?.type === "external") {
    cover = page.cover.external.url;
  } else if (page.cover?.type === "file") {
    cover = page.cover.file.url;
  }
  cover = rewriteNotionImageUrl(cover, page.id);

  return {
    title: getTitle(page),
    ingress: getText("Ingress", page),
    created: page.created_time,
    tags: getMultiSelectAndColor("Tags", page) ?? [],
    language:
      getOneOfOrUndefined(["Norsk", "Engelsk"], getSelect("Språk", page)) ??
      "Norsk",
    cover,
  };
};

export const prepareBloggEntryWithContent = (
  page: DatabasePage,
  blocks: BlockWithChildren[],
): BloggEntryWithContent => {
  return { ...prepareBloggEntry(page), notionBlocks: blocks };
};

export const loader = async ({ request }: LoaderArgs) => {
  const entryPages = await getBloggEntries();
  const entries = entryPages.map(prepareBloggEntry);

  return json(
    {
      entries,
      debugData: await maybePrepareDebugData(request, {
        entryPages,
      }),
    },
    { headers: config.cacheControlHeaders },
  );
};

export default function BloggIndex() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <div className="mx-[5vw] md:mx-[10vw]">
        {data.entries.map((x) => (
          <BloggEntryCard key={x.title} entry={x} />
        ))}
      </div>
      <Debug debugData={data.debugData} />
    </>
  );
}

interface BloggEntryCardProps {
  entry: BloggEntry;
}
const BloggEntryCard = ({ entry }: BloggEntryCardProps) => {
  return (
    <Link className="rounded overflow-hidden" to="/">
      <img src={entry.cover} alt="" className="w-full aspect-video" />
      <div className="p-4">
        <h2 className="text-white font-semibold text-4xl">{entry.title}</h2>
        <p className="text-gray-200">
          {new Date(entry.created).toLocaleDateString("no", {
            weekday: "short",
            year: "numeric",
            month: "long",
            day: "2-digit",
          })}
        </p>
        <p className="text-gray-100">{entry.ingress}</p>
      </div>
    </Link>
  );
};
