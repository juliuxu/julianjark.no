import type {
  HeadersFunction,
  LoaderArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import Debug from "~/components/debug";
import { maybePrepareDebugData } from "~/components/debug.server";
import {
  notionRenderClasses,
  notionRenderComponents,
} from "~/components/notion-render-config";
import config from "~/config.server";
import {
  getMultiSelect,
  getTitle,
  getTodayILearnedEntries,
  takeBlocksAfterHeader,
} from "~/notion/notion";
import type { Block } from "~/notion/notion.types";
import { getBlocksWithChildren } from "~/notion/notion-api.server";
import NotionRender from "~/packages/notion-render";
import { prepareNotionBlocks } from "~/packages/notion-shiki-code/prepare.server";

interface TodayILearnedEntry {
  title: string;
  created: Date;
  tags: string[];
  notionBlocks: Block[];
  references: string[];
}

export const headers: HeadersFunction = ({ loaderHeaders }) => loaderHeaders;
export const loader = async ({ request }: LoaderArgs) => {
  const entryPages = await getTodayILearnedEntries();
  const entries = await Promise.all(
    entryPages.map(async (page) => {
      const blocks = await getBlocksWithChildren(page.id);
      await prepareNotionBlocks(blocks, { theme: "dark-plus" });

      const [referenceBlocks, notionBlocks] = takeBlocksAfterHeader(
        "Referanser",
        blocks,
      );
      const references = referenceBlocks
        .filter((x) => x.type === "bookmark")
        .map((x) => {
          return (x as any).bookmark.url;
        });

      const result: TodayILearnedEntry = {
        title: getTitle(page),
        created: new Date(page.created_time),
        tags: getMultiSelect("Tags", page) ?? [],
        notionBlocks,
        references,
      };
      return result;
    }),
  );

  return json(
    {
      entries,
      debugData: await maybePrepareDebugData(request, {
        entries,
      }),
    },
    { headers: config.cacheControlHeaders },
  );
};

export const meta: MetaFunction = () => ({
  title: "Julian Jark",
});

export default function TodayILearned() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <div lang="no">
        {data.entries.map((entry) => (
          <article key={entry.title}>
            <h3 className="text-2xl text-white">{entry.title}</h3>
            <span className="text-gray-300">
              {new Date(entry.created).toLocaleDateString("no", {
                weekday: "short",
                year: "numeric",
                month: "long",
                day: "2-digit",
              })}
            </span>
            <div className="prose prose-invert">
              <NotionRender
                components={notionRenderComponents}
                classes={notionRenderClasses}
                blocks={entry.notionBlocks}
              />
            </div>
            {entry.references.length > 0 && (
              <ul>
                {entry.references.map((reference) => (
                  <li key={reference}>
                    <a href={reference}>{reference}</a>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
      <Debug debugData={data.debugData} />
    </>
  );
}
