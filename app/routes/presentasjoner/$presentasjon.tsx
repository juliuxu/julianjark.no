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

  "Show debug slide": boolean;
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
    "Show debug slide": getCheckbox("Show debug slide", page) ?? false,
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
  return (
    <>
      <link rel="stylesheet" href={themes[data.properties.Theme]} />
      <NotionRevealPresentation {...prepare(data)} />
    </>
  );
}
