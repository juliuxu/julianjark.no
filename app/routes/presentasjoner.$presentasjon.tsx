import {
  LoaderFunction,
  json,
  MetaFunction,
  LinksFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import NotionReveal from "~/notion-reveal";
import {
  findPageBySlugPredicate,
  getPresentasjoner,
  getTitle,
} from "~/service/notion";
import {
  DatabasePage,
  getBlocksWithChildren,
} from "~/service/notionApi.server";
import { assertItemFound } from "~/common";

import { Block } from "~/service/notion.types";

import type { PresentationProperties, Slide } from "~/notion-reveal/prepare";
import {
  prepareSlides,
  parsePresentationProperties,
} from "~/notion-reveal/prepare";

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
import capraRevealTheme from "~/styles/capraRevealTheme.css";

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
  capra: capraRevealTheme,
} as const;
export type Theme = keyof typeof themes;
const themeKeys = Object.keys(themes) as Theme[];
const defaultTheme: Theme = "black";
export const getThemeOrDefault = (maybeTheme: string) =>
  themeKeys.includes(maybeTheme as Theme)
    ? (maybeTheme as Theme)
    : defaultTheme;

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: prismStyles },
  { rel: "stylesheet", href: revealCss },

  // Source sans is used a lot in the the themes
  // As well as the capra theme
  // Remix doesn't work well with fontsource, so have to inline it
  { rel: "stylesheet", href: "/fontsource/source-sans-pro/index.css" },
  { rel: "stylesheet", href: "/fontsource/source-sans-pro/400.css" },
  { rel: "stylesheet", href: "/fontsource/source-sans-pro/700.css" },
];

interface Data {
  page: DatabasePage;
  properties: PresentationProperties;
  slides: Slide[];
  blocks: Block[];
}
export const loader: LoaderFunction = async ({
  params: { presentasjon = "" },
}) => {
  const page = (await getPresentasjoner()).find(
    findPageBySlugPredicate(presentasjon)
  );
  assertItemFound(page);

  const properties = parsePresentationProperties(page);
  const blocks = await getBlocksWithChildren(page.id);
  const slides = prepareSlides(blocks);

  return json<Data>({ page, blocks, properties, slides });
};

export const meta: MetaFunction = ({ data }: { data: Data }) => {
  return {
    title: getTitle(data.page),
    description: data.properties.Ingress,
  };
};

export default function Presentasjon() {
  const data = useLoaderData<Data>();
  return (
    <>
      <link rel="stylesheet" href={themes[data.properties.Theme]} />
      <NotionReveal {...data} />
    </>
  );
}
