import {
  json,
  MetaFunction,
  LinksFunction,
  HeadersFunction,
  LoaderArgs,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import NotionReveal from "~/packages/notion-reveal";
import {
  findPageBySlugPredicate,
  getPresentasjoner,
  getTitle,
} from "~/notion/notion";
import {
  DatabasePage,
  getBlocksWithChildren,
} from "~/notion/notion-api.server";
import { assertItemFound } from "~/utils";

import { Block } from "~/notion/notion.types";

import type {
  PresentationProperties,
  Slide,
} from "~/packages/notion-reveal/prepare";
import {
  prepareSlides,
  parsePresentationProperties,
} from "~/packages/notion-reveal/prepare";
import notionRevealStyles from "~/packages/notion-reveal/styles.css";
import codeStyles from "~/styles/code.css";
import { prepareNotionBlocks } from "~/packages/notion-shiki-code/prepare.server";

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
import config from "~/config.server";

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
  { rel: "stylesheet", href: revealCss },
  { rel: "stylesheet", href: codeStyles },
  { rel: "stylesheet", href: notionRevealStyles },

  // Source sans is used a lot in the the themes
  // As well as the capra theme
  // Remix doesn't work well with fontsource, so have to inline it
  { rel: "stylesheet", href: "/fontsource/source-sans-pro/index.css" },
  { rel: "stylesheet", href: "/fontsource/source-sans-pro/400.css" },
  { rel: "stylesheet", href: "/fontsource/source-sans-pro/700.css" },
];

export const loader = async ({ params: { presentasjon = "" } }: LoaderArgs) => {
  const page = (await getPresentasjoner()).find(
    findPageBySlugPredicate(presentasjon)
  );
  assertItemFound(page);

  const properties = parsePresentationProperties(page);
  const blocks = await getBlocksWithChildren(page.id);
  await prepareNotionBlocks(blocks, { theme: "dark-plus" });
  const slides = prepareSlides(blocks);

  return json(
    { page, blocks, properties, slides },
    { headers: config.cacheControlHeadersDynamic(page.last_edited_time) }
  );
};

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return loaderHeaders;
};

export const meta: MetaFunction = ({ data }) => {
  return {
    title: getTitle(data.page),
    description: data.properties.Ingress,
  };
};

export default function Presentasjon() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <link rel="stylesheet" href={themes[data.properties.Theme]} />
      <NotionReveal {...data} />
    </>
  );
}
