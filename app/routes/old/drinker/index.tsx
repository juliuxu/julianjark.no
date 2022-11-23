import type {
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";

import config from "~/config";
import { getDrinker } from "~/notion/notion";
import tailwind from "~/styles/tailwind.css";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: tailwind,
  },
];

export const loader: LoaderFunction = async () => {
  const drinker = await getDrinker();
  return json({ drinker }, { headers: config.cacheControlHeaders });
};

export const meta: MetaFunction = () => ({
  title: "Drinker",
});

export default function Drinker() {
  return <div>Velg en drink</div>;
}
