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
import config from "~/config";
import { getBlocksWithChildren } from "~/notion/notion-api.server";
import NotionRender from "~/packages/notion-render";
import { prepareNotionBlocks } from "~/packages/notion-shiki-code/prepare.server";

export const loader = async ({ request }: LoaderArgs) => {
  const startFetchTime = performance.now();
  const blocks = await getBlocksWithChildren(config.forsidePageId);
  const fetchTime = Math.round(performance.now() - startFetchTime);

  await prepareNotionBlocks(blocks, { theme: "dark-plus" });

  // Dynamic age
  const [age] = getAgeFromBirthDate(new Date("1992-11-02"));
  const f = (_blocks: typeof blocks) => {
    for (let block of _blocks) {
      if ((block as any).code?.shikiCodeHtml) {
        (block as any).code.shikiCodeHtml = (
          block as any
        ).code.shikiCodeHtml.replace("29 år gammel", `${age} år gammel`);
        return true;
      }
      if (block.has_children) {
        let result = f((block as any)[block.type].children);
        if (result) return true;
      }
    }
    return false;
  };
  f(blocks);

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

export const meta: MetaFunction = () => {
  const [age] = getAgeFromBirthDate(new Date("1992-11-02"));
  return {
    title: "Julian Jark",
    description: `${age} år gammel hundeelsker, drinkmaker, turgåer, kodeskriver`,
  };
};

export const commonTailwindStyles = /*tw*/ {
  prose: "prose prose-slate !prose-invert", // prose-figure:my-0 prose-pre:my-0
};
export default function Index() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <div className="mx-[5vw]">
        <div
          className={`max-w-full mx-auto mt-4 ${commonTailwindStyles.prose}`}
        >
          <NotionRender
            components={notionRenderComponents}
            classes={notionRenderClasses}
            blocks={data.blocks}
          />
        </div>
      </div>
      <Debug debugData={data.debugData} />
    </>
  );
}

const getAgeFromBirthDate = (birthDate: Date) => {
  const now = new Date();

  const d1 = birthDate.getDate();
  const m1 = 1 + birthDate.getMonth();
  const y1 = birthDate.getFullYear();

  let d2 = now.getDate();
  let m2 = 1 + now.getMonth();
  let y2 = now.getFullYear();
  const month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (d1 > d2) {
    d2 = d2 + month[m2 - 1];
    m2 = m2 - 1;
  }
  if (m1 > m2) {
    m2 = m2 + 12;
    y2 = y2 - 1;
  }
  const d = d2 - d1;
  const m = m2 - m1;
  const y = y2 - y1;
  return [y, m, d];
};
