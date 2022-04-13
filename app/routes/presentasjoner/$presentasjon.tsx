import {
  LoaderFunction,
  json,
  MetaFunction,
  LinksFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import NotionRevealPresentation, {
  links as notionRevealPresentationLinks,
} from "~/components/notionRevealPresentation";
import { CollapsedCode } from "~/components/code";
import {
  findPageBySlugPredicate,
  getPresentasjoner,
  getTitle,
} from "~/service/notion";
import { DatabasePage, getBlocks } from "~/service/notionApi.server";
import { assertItemFound } from "~/common";

import { Block } from "~/service/notion.types";

// TODO: Get this from the notionRevealPresentation file
export const links: LinksFunction = () => [...notionRevealPresentationLinks()];

type Data = { page: DatabasePage; blocks: Block[] };
export const loader: LoaderFunction = async ({
  params: { presentasjon = "" },
}) => {
  const page = (await getPresentasjoner()).find(
    findPageBySlugPredicate(presentasjon)
  );
  assertItemFound(page);

  const blocks = await getBlocks(page.id);

  return json<Data>({ page, blocks });
};

export const meta: MetaFunction = ({ data }) => {
  return {
    title: getTitle(data.page),
  };
};

const groupByBlockType = (type: Block["type"], blocks: Block[]) => {
  const groups: Block[][] = [];
  let currentGroup: Block[] = [];
  for (const block of blocks) {
    if (block.type === type) {
      if (currentGroup.length > 1) {
        groups.push(currentGroup);
      }
      currentGroup = [];
    }
    currentGroup.push(block);
  }
  groups.push(currentGroup);

  return groups;
};

const prepare = (data: Data) => {
  let slides = groupByBlockType("divider", data.blocks);
  slides = slides.map((slide) =>
    slide.filter((block) => block.type !== "divider")
  );

  return { slides };
};

export default function Presentasjon() {
  const data = useLoaderData<Data>();
  const presentationData = prepare(data);
  return (
    <>
      <NotionRevealPresentation slides={presentationData.slides} />
      <div style={{ bottom: 0 }}>
        <CollapsedCode
          open
          language="json"
          code={JSON.stringify(data.page, null, 2)}
        />
      </div>
    </>
  );
}
