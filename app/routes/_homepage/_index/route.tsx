import type {
  HeadersFunction,
  LoaderArgs,
  V2_MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import Debug from "~/components/debug";
import { maybePrepareDebugData } from "~/components/debug.server";
import {
  notionRenderClasses,
  notionRenderComponents,
} from "~/components/notion-render-config";
import config from "~/config";
import { getBlocksWithChildren } from "~/notion/notion-api.server";
import NotionRender from "~/packages/notion-render";
import { prepareNotionBlocksWithShiki } from "~/packages/notion-shiki-code/prepare.server";
import {
  commonTailwindStyles,
  HorizontalLayout,
  prepareSkipKladdBlocks,
} from "../$notionDrivenPage/route";
import { sharedMeta } from "../route";
import { getAgeFromBirthDate, prepareDynamicAge } from "./dynamic-age";

export const loader = async ({ request }: LoaderArgs) => {
  const startFetchTime = performance.now();
  const blocks = await getBlocksWithChildren(config.forsidePageId);
  const fetchTime = Math.round(performance.now() - startFetchTime);

  await prepareNotionBlocksWithShiki(blocks, { theme: "dark-plus" });
  prepareSkipKladdBlocks(blocks);
  prepareDynamicAge(blocks);

  return json(
    {
      blocks,
      debugData: await maybePrepareDebugData(request, blocks),
    },
    {
      headers: {
        ...config.cacheControlHeaders,
        "Server-Timing": `fetch;dur=${fetchTime}`,
      },
    },
  );
};
export const headers: HeadersFunction = ({ loaderHeaders }) => loaderHeaders;

export const meta: V2_MetaFunction = () => {
  const [age] = getAgeFromBirthDate(new Date("1992-11-02"));
  return [
    ...sharedMeta,
    {
      title: "Julian Jark",
    },
    {
      name: "description",
      content: `${age} år gammel hundevenn, drinkmaker, turgåer, kodeskriver, musikkavspiller`,
    },
  ];
};

export default function Component() {
  const data = useLoaderData<typeof loader>();
  return (
    <HorizontalLayout className={commonTailwindStyles.prose}>
      <NotionRender
        components={notionRenderComponents}
        classes={notionRenderClasses}
        blocks={data.blocks}
      />
      <Debug debugData={data.debugData} />
    </HorizontalLayout>
  );
}
