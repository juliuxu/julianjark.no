import { useLoaderData } from "@remix-run/react";
import type {
  HeadersFunction,
  LoaderArgs,
  MetaFunction,
} from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";

import {
  notionRenderClasses,
  notionRenderComponents,
} from "~/components/notion-render-config";
import config from "~/config";
import {
  findPageBySlugPredicate,
  getBloggEntries,
  getTitle,
} from "~/notion/notion";
import { getBlocksWithChildren } from "~/notion/notion-api.server";
import NotionRender from "~/packages/notion-render";
import { prepareNotionBlocks } from "~/packages/notion-shiki-code/prepare.server";
import { assertItemFound } from "~/utils";
import type { BloggEntryWithContent } from ".";
import { prepareBloggEntry } from ".";

export const loader = async ({
  request,
  params: { slug = "" },
}: LoaderArgs) => {
  const page = (await getBloggEntries(request)).find(
    findPageBySlugPredicate(slug),
  );
  assertItemFound(page);

  const blocks = await getBlocksWithChildren(page.id);
  await prepareNotionBlocks(blocks, { theme: "dark-plus" });
  const entry: BloggEntryWithContent = {
    ...prepareBloggEntry(page),
    notionBlocks: blocks,
  };

  return json(
    { entry },
    { headers: config.cacheControlHeadersDynamic(page.last_edited_time) },
  );
};
export let headers: HeadersFunction = ({ loaderHeaders }) => loaderHeaders;

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return {
    title: data.entry.title,
    description: data.entry.ingress,
    "og:title": data.entry.title,
    "og:description": data.entry.ingress,

    "og:image": data.entry.cover,
    "twitter:card": "summary_large_image",

    // Published date
    publish_date: data.entry.created,
    "og:publish_date": data.entry.created,
    "article:published_time": data.entry.created,
  };
};

export default function Blogg() {
  const { entry } = useLoaderData<typeof loader>();
  return (
    <div className="mx-[5vw] md:mx-[10vw]">
      <div className="overflow-hidden rounded-lg">
        <img src={entry.cover} alt="" className="aspect-video w-full" />
      </div>

      <h1 className="text-6xl font-semibold text-white">{entry.title}</h1>
      {/* <p className="mt-1 text-gray-300">{formatDate(data.created)}</p> */}
      <div className="prose prose-invert mt-8 max-w-full">
        <NotionRender
          components={notionRenderComponents}
          classes={notionRenderClasses}
          blocks={entry.notionBlocks}
        />
      </div>
    </div>
  );
}
