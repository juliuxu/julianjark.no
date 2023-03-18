import type {
  HeadersFunction,
  LinksFunction,
  LoaderArgs,
  V2_MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import revealCss from "reveal.js/dist/reveal.css";
import beigeRevealTheme from "reveal.js/dist/theme/beige.css";
import blackRevealTheme from "reveal.js/dist/theme/black.css";
import bloodRevealTheme from "reveal.js/dist/theme/blood.css";
import leagueRevealTheme from "reveal.js/dist/theme/league.css";
import moonRevealTheme from "reveal.js/dist/theme/moon.css";
import nightRevealTheme from "reveal.js/dist/theme/night.css";
import serifRevealTheme from "reveal.js/dist/theme/serif.css";
import simpleRevealTheme from "reveal.js/dist/theme/simple.css";
import skyRevealTheme from "reveal.js/dist/theme/sky.css";
import solarizedRevealTheme from "reveal.js/dist/theme/solarized.css";
import whiteRevealTheme from "reveal.js/dist/theme/white.css";

import config from "~/config";
import {
  findPageBySlugPredicate,
  getPresentasjoner,
  getTitle,
} from "~/notion/notion";
import { getBlocksWithChildrenNoCache } from "~/notion/notion-api.server";
import NotionReveal from "~/packages/notion-reveal";
import {
  parsePresentationProperties,
  prepareSlides,
} from "~/packages/notion-reveal/prepare";
import notionRevealStyles from "~/packages/notion-reveal/styles.css";
import { prepareNotionBlocksWithShiki } from "~/packages/notion-shiki-code/prepare.server";
import capraRevealTheme from "~/styles/capraRevealTheme.css";
import fontSourceSansPro from "~/styles/font-source-sans-pro.css";
import codeStyles from "~/styles/shiki-code.css";
import { assertItemFound } from "~/utils";

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
  { rel: "stylesheet", href: fontSourceSansPro },
];

export const loader = async ({ params: { presentasjon = "" } }: LoaderArgs) => {
  const page = (await getPresentasjoner()).find(
    findPageBySlugPredicate(presentasjon),
  );
  assertItemFound(page);

  const properties = parsePresentationProperties(page);
  const blocks = await getBlocksWithChildrenNoCache(page.id);
  await prepareNotionBlocksWithShiki(blocks, { theme: "dark-plus" });
  const slides = prepareSlides(blocks);

  return json(
    { page, blocks, properties, slides },
    { headers: config.cacheControlHeadersDynamic(page.last_edited_time) },
  );
};

export let headers: HeadersFunction = ({ loaderHeaders }) => loaderHeaders;

export const meta: V2_MetaFunction = ({ data }) => [
  {
    title: getTitle(data.page),
  },
  {
    name: "description",
    content: data.properties.Ingress,
  },
];

export default function Presentasjon() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <link rel="stylesheet" href={themes[data.properties.Theme]} />
      <NotionReveal {...data} />
    </>
  );
}
