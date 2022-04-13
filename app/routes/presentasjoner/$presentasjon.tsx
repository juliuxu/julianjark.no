import {
  LoaderFunction,
  json,
  MetaFunction,
  LinksFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import NotionRevealPresentation from "~/components/notionRevealPresentation";
import {
  findPageBySlugPredicate,
  getPresentasjoner,
  getText,
  getTitle,
} from "~/service/notion";
import { getCheckbox, getSelect } from "~/service/notion";
import { DatabasePage, getBlocks } from "~/service/notionApi.server";
import { assertItemFound } from "~/common";

import { Block } from "~/service/notion.types";

import revealCss from "reveal.js/dist/reveal.css";
import { defaultTheme, Theme, themeKeys } from "./theme[.]css";
import prismStyles from "prismjs/themes/prism-tomorrow.css";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: prismStyles },
  { rel: "stylesheet", href: revealCss },
  { rel: "stylesheet", href: "theme.css" },
];

const transitions = [
  "none",
  "fade",
  "slide",
  "convex",
  "concave",
  "zoom",
] as const;
type Transition = typeof transitions[number];
const defaultTransition: Transition = "slide";

type PresentationProperties = {
  Ingress?: string;
  Theme: Theme;
  "Slide number": boolean;
  Transition: Transition;
  "Hide progress bar": boolean;
};

const parsePresentationProperties = (
  page: DatabasePage
): PresentationProperties => {
  const themeProperty = getSelect("Theme", page) ?? "";
  const transitionProperty = getSelect("Transition", page) ?? "";
  const result: PresentationProperties = {
    Ingress: getText("Ingress", page),
    Theme: themeKeys.includes(themeProperty as Theme)
      ? (themeProperty as Theme)
      : defaultTheme,

    Transition: transitions.includes(transitionProperty as Transition)
      ? (transitionProperty as Transition)
      : defaultTransition,

    "Slide number": getCheckbox("Slide number", page) ?? false,

    "Hide progress bar": getCheckbox("Hide progress bar", page) ?? false,
  };
  return result;
};

type Data = {
  page: DatabasePage;
  properties: PresentationProperties;
  blocks: Block[];
};
export const loader: LoaderFunction = async ({
  params: { presentasjon = "" },
}) => {
  const page = (await getPresentasjoner()).find(
    findPageBySlugPredicate(presentasjon)
  );
  assertItemFound(page);

  const properties = parsePresentationProperties(page);
  const blocks = await getBlocks(page.id);

  return json<Data>(
    { page, properties, blocks },
    {
      headers: {
        "set-cookie": `presentation-theme=${properties.Theme}; Max-Age=60`,
      },
    }
  );
};

export const meta: MetaFunction = ({ data }) => {
  return {
    title: getTitle(data.page),
    description: data.properties.Ingress ?? "YOLOLO",
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
export interface Slide {
  notes: Block[];
  content: Block[];
}
export interface PreparedData {
  properties: PresentationProperties;
  slides: Slide[];
}
const prepare = (data: Data): PreparedData => {
  let groupedBlocks = groupByBlockType("divider", data.blocks);
  groupedBlocks = groupedBlocks.map((slide) =>
    slide.filter((block) => block.type !== "divider")
  );

  let slides = groupedBlocks.map((slide) => {
    const notes = slide.filter((block) => block.type === "callout");
    const content = slide.filter((block) => block.type !== "callout");
    return { notes, content };
  });

  return { slides, properties: data.properties };
};

export default function Presentasjon() {
  const data = useLoaderData<Data>();
  return <NotionRevealPresentation {...prepare(data)} />;
}
