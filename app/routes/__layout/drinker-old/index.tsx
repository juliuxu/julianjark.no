import {
  HeadersFunction,
  json,
  LoaderArgs,
  MetaFunction,
} from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getDrinker, getTitle, slugify } from "~/notion/notion";
import Debug from "~/components/debug";
import config from "~/config.server";
import { maybePrepareDebugData } from "~/components/debug.server";

export const loader = async ({ request }: LoaderArgs) => {
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
