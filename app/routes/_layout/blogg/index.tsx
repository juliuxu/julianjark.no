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
  slugify,
} from "~/notion/notion";
import type {
  Block,
  BlockWithChildren,
  SelectColor,
} from "~/notion/notion.types";
import type { DatabasePage } from "~/notion/notion-api.server";
import {
  formatDate,
  getOneOfOrUndefined,
  rewriteNotionImageUrl,
} from "~/utils";

export interface BloggEntry {
  title: string;
  created: string;
  tags: { title: string; color: SelectColor }[];
  ingress: string;
  language: "Norsk" | "Engelsk";
  cover: string;
}
export type BloggEntryWithContent = BloggEntry & { notionBlocks: Block[] };

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
  const entryPages = await getBloggEntries(request);
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
    <Link to={slugify(entry.title)}>
      <div className="overflow-hidden rounded-lg ring-pink-500 ring-offset-4 ring-offset-[#11191f] transition-all duration-300 hover:ring focus:ring">
        <img src={entry.cover} alt="" className="aspect-video w-full" />
        <div className="p-4">
          <h2 className="text-4xl font-semibold text-white">{entry.title}</h2>
          <p className="mt-1 text-gray-300">{formatDate(entry.created)}</p>
          <p className="mt-2 text-gray-200">{entry.ingress}</p>
        </div>
      </div>
    </Link>
  );
};
