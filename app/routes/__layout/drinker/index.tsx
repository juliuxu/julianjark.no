import {
  HeadersFunction,
  json,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getDrinker, getTitle, slugify } from "~/service/notion";
import { DatabasePage } from "~/service/notionApi.server";
import Debug from "~/components/debug";
import config from "~/config.server";

type Data = { drinker: DatabasePage[] };
export const loader: LoaderFunction = async () => {
  return json(
    {
      drinker: await getDrinker(),
    },
    { headers: config.cacheControlHeaders }
  );
};
export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return loaderHeaders;
};

export const meta: MetaFunction = () => ({
  title: "Drinker",
});

export default function Index() {
  const data = useLoaderData<Data>();
  return (
    <>
      <h1>Drinker</h1>
      <ul>
        {data.drinker.map((drink) => (
          <li key={drink.id}>
            <Link to={slugify(getTitle(drink))} prefetch="intent">
              {getTitle(drink)}
            </Link>
          </li>
        ))}
      </ul>
      <Debug pageData={data.drinker} />
    </>
  );
}
