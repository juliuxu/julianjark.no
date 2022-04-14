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
import { getCheckbox, getSelect, getTextFromRichText } from "~/service/notion";
import { DatabasePage, getBlocks } from "~/service/notionApi.server";
import { assertItemFound } from "~/common";

import { Block } from "~/service/notion.types";

import prismStyles from "prismjs/themes/prism-tomorrow.css";
import revealCss from "reveal.js/dist/reveal.css";
import blackRevealTheme from "reveal.js/dist/theme/black.css";
import whiteRevealTheme from "reveal.js/dist/theme/white.css";
import leagueRevealTheme from "reveal.js/dist/theme/league.css";
import beigeRevealTheme from "reveal.js/dist/theme/beige.css";
import skyRevealTheme from "reveal.js/dist/theme/sky.css";
import nightRevealTheme from "reveal.js/dist/theme/night.css";
import serifRevealTheme from "reveal.js/dist/theme/serif.css";
import simpleRevealTheme from "reveal.js/dist/theme/simple.css";
import solarizedRevealTheme from "reveal.js/dist/theme/solarized.css";
import bloodRevealTheme from "reveal.js/dist/theme/blood.css";
import moonRevealTheme from "reveal.js/dist/theme/moon.css";

const themes = {
  black: blackRevealTheme,
  white: whiteRevealTheme,
  league: leagueRevealTheme,
  beige: beigeRevealTheme,
  sky: skyRevealTheme,
  night: nightRevealTheme,
  serif: serifRevealTheme,
  simple: simpleRevealTheme,
  solarized: solarizedRevealTheme,
  blood: bloodRevealTheme,
  moon: moonRevealTheme,
} as const;
export type Theme = keyof typeof themes;
export const themeKeys = Object.keys(themes) as Theme[];
export const defaultTheme: Theme = "black";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: prismStyles },
  { rel: "stylesheet", href: revealCss },
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
  "Hide controls": boolean;

  "Show debug slides": boolean;
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
    "Hide controls": getCheckbox("Hide controls", page) ?? false,
    "Show debug slides": getCheckbox("Show debug slides", page) ?? false,
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

  return json<Data>({ page, properties, blocks });
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
  subSlides: SubSlide[];
}
export interface SubSlide {
  notes: Block[];
  content: Block[];
}
interface SlideWithoutNotes {
  content: Block[];
  subSlides: SubSlideWithoutNotes[];
}
interface SubSlideWithoutNotes {
  content: Block[];
}
export interface PreparedData {
  properties: PresentationProperties;
  slides: Slide[];
}
const prepare = (data: Data): PreparedData => {
  // Remove unsupported blocks
  const filteredBlocks = data.blocks.filter(
    (block) => block.type !== "divider" && block.type !== "table_of_contents"
  );

  // Group level 1
  let level1 = groupByBlockType("heading_1", filteredBlocks);

  // Group level 2
  let level2 = level1.map((blockList): SlideWithoutNotes => {
    const blockListInner = blockList.slice();
    let content: Block[] = [];

    // Take while we have not encountered a h2_heading
    while (true) {
      const current = blockListInner.shift();
      if (current === undefined || current.type === "heading_2") {
        break;
      }
      content.push(current);
    }

    // Group the rest based on h2 headings into subSlides
    const subSlides = groupByBlockType("heading_2", blockListInner).map(
      (content) => ({ content })
    );

    return {
      content,
      subSlides,
    };
  });

  // Extract notes
  const NOTES_BLOCK_TYPE = "callout";
  const extractNotes = (
    withoutNotes: SlideWithoutNotes | SubSlideWithoutNotes
  ) => {
    const notes = withoutNotes.content.filter(
      (block) => block.type === NOTES_BLOCK_TYPE
    );
    const content = withoutNotes.content.filter(
      (block) => block.type !== NOTES_BLOCK_TYPE
    );
    return { notes, content };
  };

  let slides: Slide[] = level2.map((slideWithoutNotes) => ({
    ...extractNotes(slideWithoutNotes),
    subSlides: slideWithoutNotes.subSlides.map(extractNotes),
  }));

  // Remove heading blocks containing `—`
  // They mean we don't want a visible heading
  const HIDE_HEADING_TOKEN = "—";
  const removeHiddenHeadingsPredicate = (block: Block) => {
    if (
      (block.type === "heading_1" &&
        getTextFromRichText(block.heading_1.rich_text) ===
          HIDE_HEADING_TOKEN) ||
      (block.type === "heading_2" &&
        getTextFromRichText(block.heading_2.rich_text) === HIDE_HEADING_TOKEN)
    ) {
      return false;
    }
    return true;
  };
  slides = slides.map((slide) => ({
    notes: slide.notes,
    content: slide.content.filter(removeHiddenHeadingsPredicate),
    subSlides: slide.subSlides.map((subSlide) => ({
      ...subSlide,
      content: subSlide.content.filter(removeHiddenHeadingsPredicate),
    })),
  }));

  return { slides, properties: data.properties };
};

export default function Presentasjon() {
  const data = useLoaderData<Data>();
  return (
    <>
      <link rel="stylesheet" href={themes[data.properties.Theme]} />
      <NotionRevealPresentation {...prepare(data)} />
    </>
  );
}
