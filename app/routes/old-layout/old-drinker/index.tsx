import type {
  HeadersFunction,
  LoaderArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import Debug from "~/components/debug";
import { maybePrepareDebugData } from "~/components/debug.server";
import config from "~/config.server";
import { getDrinker, getTitle, slugify } from "~/notion/notion";

export const loader = async ({ request }: LoaderArgs) => {
  const drinker = await getDrinker();
  return json(
    {
      drinker,
      debugData: await maybePrepareDebugData(request, { drinker }),
    },
    { headers: config.cacheControlHeaders },
  );
};
export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return loaderHeaders;
};

export const meta: MetaFunction = () => ({
  title: "Drinker",
});

export default function Index() {
  const data = useLoaderData<typeof loader>();
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
