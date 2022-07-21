import { LinksFunction, json, MetaFunction, LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import config from "~/config.server";
import { getDrinker } from "~/notion/notion";
import tailwind from "~/tailwind.css";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: tailwind,
  },
];

export const loader = async ({}: LoaderArgs) => {
  const drinker = await getDrinker();
  return json({ drinker }, { headers: config.cacheControlHeaders });
};

export const meta: MetaFunction = () => ({
  title: "Drinker",
});

export default function Drinker() {
  const data = useLoaderData<typeof loader>();
  return <div>Velg en drink</div>;
}
