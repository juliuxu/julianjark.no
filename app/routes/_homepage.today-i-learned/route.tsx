import type {
  HeadersFunction,
  LoaderArgs,
  V2_MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { NavLink, Outlet, useLoaderData } from "@remix-run/react";

import Debug from "~/components/debug";
import { maybePrepareDebugData } from "~/components/debug.server";
import {
  notionRenderClasses,
  notionRenderComponents,
  notionSelectClasses,
} from "~/components/notion-render-config";
import { PermalinkHeading } from "~/components/permalink-heading";
import { FloatingScrollNextPreviousButtons } from "~/components/scroll-next-previous";
import config from "~/config";
import {
  getMultiSelectAndColor,
  getTitle,
  getTodayILearnedEntries,
  slugify,
  takeBlocksAfterHeader,
} from "~/notion/notion";
import type {
  Block,
  BlockWithChildren,
  SelectColor,
} from "~/notion/notion.types";
import type { DatabasePage } from "~/notion/notion-api.server";
import { getBlocksWithChildren } from "~/notion/notion-api.server";
import NotionRender from "~/packages/notion-render";
import { prepareNotionBlocksWithShiki } from "~/packages/notion-shiki-code/prepare.server";
import { commonTailwindStyles } from "~/routes/_homepage.$notionDrivenPage/route";
import { sharedMeta } from "~/routes/_homepage/route";
import { formatDate } from "~/utils";

interface TodayILearnedEntry {
  title: string;
  created: Date;
  tags: { title: string; color: SelectColor }[];
  notionBlocks: Block[];
  references: string[];
}
export const prepareTodayILearendEntry = (
  page: DatabasePage,
  blocks: BlockWithChildren[],
) => {
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
        const firstLink = x.paragraph.rich_text.find((r) => r.href !== null);
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
};

export const headers: HeadersFunction = ({ loaderHeaders }) => loaderHeaders;
export const loader = async ({ request }: LoaderArgs) => {
  const entryPages = await getTodayILearnedEntries();
  const entries = await Promise.all(
    entryPages.map(async (page) => {
      const blocks = await getBlocksWithChildren(page.id);
      await prepareNotionBlocksWithShiki(blocks, { theme: "dark-plus" });
      return prepareTodayILearendEntry(page, blocks);
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
export type Loader = typeof loader;

export const meta: V2_MetaFunction = () => [
  ...sharedMeta,
  {
    title: "I dag lærte jeg",
  },
  { name: "description", content: "Her publiserer jeg småting jeg lærer" },
];

export default function TodayILearned() {
  const data = useLoaderData<typeof loader>();
  const entries = data.entries.map((x) => ({
    ...x,
    created: new Date(x.created),
  }));
  return (
    <>
      <div lang="no" className="mx-[5vw] md:mx-[10vw]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row-reverse">
          <div className="w-full md:w-1/4">
            <TodayILearnedMenu entries={entries} />
          </div>
          <Outlet />
          <div className="flex w-full flex-col gap-10 md:w-3/4">
            {entries.map((entry) => (
              <InlineTodayILearnedEntry key={entry.title} entry={entry} />
            ))}
          </div>
        </div>
        <FloatingScrollNextPreviousButtons
          articleIds={entries.map((x) => slugify(x.title))}
        />
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
    <div className="flex flex-col gap-3 rounded p-2 ring-1 md:sticky md:top-6 md:max-h-screen md:gap-5">
      {entries.map((entry) => (
        <NavLink
          key={entry.title}
          className="text-gray-300 transition hover:text-white focus:text-white"
          to={slugify(entry.title)}
          prefetch="intent"
        >
          {entry.title}{" "}
          <div className="text-sm text-gray-400">
            {formatDate(entry.created)}
          </div>
        </NavLink>
      ))}
    </div>
  );
};

interface InlineTodayILearnedEntryProps {
  entry: TodayILearnedEntry;
}
const InlineTodayILearnedEntry = ({ entry }: InlineTodayILearnedEntryProps) => {
  return (
    <article className="rounded p-4 ring-1">
      <PermalinkHeading
        as="h2"
        className="scroll-mt-10 text-3xl text-gray-100"
        id={slugify(entry.title)}
      >
        {entry.title}
      </PermalinkHeading>

      <div className="mt-2 text-sm text-gray-400">
        {formatDate(entry.created)}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {entry.tags.map((x) => (
          <span
            key={x.title}
            className={`text-xs ${notionSelectClasses[x.color]}`}
          >
            {x.title}
          </span>
        ))}
      </div>

      <div className={`mx-auto mt-4 max-w-full ${commonTailwindStyles.prose}`}>
        <NotionRender
          components={notionRenderComponents}
          classes={notionRenderClasses}
          blocks={entry.notionBlocks}
        />

        {entry.references.length > 0 && (
          <>
            <p></p>
            <ul className="my-0 break-words">
              {entry.references.map((reference) => (
                <li key={reference}>
                  <a href={reference}>{reference}</a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </article>
  );
};
