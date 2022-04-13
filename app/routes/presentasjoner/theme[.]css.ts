import { LinksFunction, LoaderFunction, redirect } from "@remix-run/node";

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

const parseCookie = (str: string) =>
  str
    .split(";")
    .map((v) => v.split("="))
    .reduce((acc, v) => {
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
      return acc;
    }, {} as Record<string, string | undefined>);

export const loader: LoaderFunction = ({ request }) => {
  const cookie = parseCookie(request.headers.get("Cookie") ?? "");
  const themeString = cookie["presentation-theme"] as Theme;
  const theme = themes[themeString] ?? defaultTheme;

  return redirect(theme);
};

export const links: LinksFunction = () =>
  Object.values(themes).map((theme) => ({
    rel: "stylesheet",
    href: theme,
  }));
