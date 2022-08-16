import type {
  HeadersFunction,
  LoaderArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { AnchorHeading } from "~/components/AnchorHeading";
import Debug from "~/components/debug";
import { maybePrepareDebugData } from "~/components/debug.server";
import {
  notionRenderClasses,
  notionRenderComponents,
  notionSelectClasses,
} from "~/components/notion-render-config";
import config from "~/config.server";
import {
  getMultiSelectAndColor,
  getTitle,
  getTodayILearnedEntries,
  slugify,
  takeBlocksAfterHeader,
} from "~/notion/notion";
import type { Block, SelectColor } from "~/notion/notion.types";
import { getBlocksWithChildren } from "~/notion/notion-api.server";
import NotionRender from "~/packages/notion-render";
import { prepareNotionBlocks } from "~/packages/notion-shiki-code/prepare.server";

interface TodayILearnedEntry {
  title: string;
  created: Date;
  tags: { title: string; color: SelectColor }[];
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
        .map((x) => {
          if (x.type === "bookmark") {
            return x.bookmark.url;
          }
          if (x.type === "paragraph") {
            const firstLink = x.paragraph.rich_text.find(
              (r) => r.href !== null,
            );
            if (firstLink && firstLink.href !== null) {
              return firstLink.href;
            }
          }

          return undefined;
        })
        .filter(function <T>(x: T | undefined): x is T {
          return x !== undefined;
        });

      const result: TodayILearnedEntry = {
        title: getTitle(page),
        created: new Date(page.created_time),
        tags: getMultiSelectAndColor("Tags", page) ?? [],
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
  title: "I dag lærte jeg",
  description: "Her publiserer jeg småting jeg lærer",
});

export default function TodayILearned() {
  const data = useLoaderData<typeof loader>();
  const entries = data.entries.map((x) => ({
    ...x,
    created: new Date(x.created),
  }));
  return (
    <>
      <div lang="no" className="mx-[5vw] md:mx-[10vw]">
        <div className="mx-auto max-w-4xl flex flex-col md:flex-row-reverse gap-6">
          <div className="w-full md:w-1/4">
            <TodayILearnedMenu entries={entries} />
          </div>
          <div className="w-full md:w-3/4 flex flex-col gap-8">
            {entries.map((entry) => (
              <InlineTodayILearnedEntry key={entry.title} entry={entry} />
            ))}
          </div>
        </div>
      </div>
      <Debug debugData={data.debugData} />
    </>
  );
}

interface TodayILearnedMenuProps {
  entries: TodayILearnedEntry[];
}
const TodayILearnedMenu = ({ entries }: TodayILearnedMenuProps) => {
  return (
    <div className="flex gap-3 flex-col rounded ring-1 p-2">
      {entries.map((entry) => (
        <a
          className="text-gray-300 focus:text-white hover:text-white transition"
          href={`#${slugify(entry.title)}`}
          key={entry.title}
        >
          {entry.title}{" "}
          <div className="text-gray-400 text-sm">
            {new Date(entry.created).toLocaleDateString("no", {
              dateStyle: "short",
            })}
          </div>
        </a>
      ))}
    </div>
  );
};

interface InlineTodayILearnedEntryProps {
  entry: TodayILearnedEntry;
}
const InlineTodayILearnedEntry = ({ entry }: InlineTodayILearnedEntryProps) => {
  return (
    <article>
      <AnchorHeading
        as="h2"
        className="text-gray-100 text-3xl scroll-mt-4"
        id={slugify(entry.title)}
      >
        {entry.title}
      </AnchorHeading>

      <div className="text-sm text-gray-400 mt-1">
        {new Date(entry.created).toLocaleDateString("no", {
          weekday: "short",
          year: "numeric",
          month: "long",
          day: "2-digit",
        })}
      </div>

      <div className="flex mt-2">
        {entry.tags.map((x) => (
          <span
            key={x.title}
            className={`text-xs ${notionSelectClasses[x.color]}`}
          >
            {x.title}
          </span>
        ))}
      </div>

      <div className="max-w-full mx-auto mt-4 prose prose-invert">
        <NotionRender
          components={notionRenderComponents}
          classes={notionRenderClasses}
          blocks={entry.notionBlocks}
        />

        {entry.references.length > 0 && (
          <details>
            <summary className="cursor-pointer text-sm">Referanser</summary>
            <ul className="my-0">
              {entry.references.map((reference) => (
                <li key={reference}>
                  <a href={reference}>{reference}</a>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </article>
  );
};