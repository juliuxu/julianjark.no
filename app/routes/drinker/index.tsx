import {
  LinksFunction,
  LoaderFunction,
  json,
  MetaFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import config from "~/config.server";
import { getDrinker, getTitle, slugify } from "~/notion/notion";
import { DatabasePage } from "~/notion/notion-api.server";
import tailwind from "~/tailwind.css";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: tailwind,
  },
];

type Data = { drinker: DatabasePage[]; debugData?: string };
export const loader: LoaderFunction = async () => {
  const drinker = await getDrinker();
  return json<Data>({ drinker }, { headers: config.cacheControlHeaders });
};

export const meta: MetaFunction = () => ({
  title: "Drinker",
});

export default function Drinker() {
  const data = useLoaderData<Data>();
  return <div>Velg en drink</div>;
}
