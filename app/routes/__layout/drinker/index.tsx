import {
  HeadersFunction,
  json,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getDrinker, getTitle, slugify } from "~/notion/notion";
import { DatabasePage } from "~/notion/notion-api.server";
import Debug from "~/components/debug";
import config from "~/config.server";
import { maybePrepareDebugData } from "~/components/debug.server";

type Data = { drinker: DatabasePage[]; debugData?: string };
export const loader: LoaderFunction = async ({ request }) => {
  const drinker = await getDrinker();
  return json(
    {
      drinker,
      debugData: await maybePrepareDebugData(request, { drinker }),
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
      <Debug debugData={data.debugData} />
    </>
  );
}
