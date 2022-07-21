import {
  HeadersFunction,
  json,
  LoaderArgs,
  MetaFunction,
} from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getPresentasjoner, getTitle, slugify } from "~/notion/notion";
import Debug from "~/components/debug";
import config from "~/config.server";
import { maybePrepareDebugData } from "~/components/debug.server";

export const loader = async ({ request }: LoaderArgs) => {
  const presentasjoner = await getPresentasjoner();

  return json(
    {
      presentasjoner,
      debugData: await maybePrepareDebugData(request, { presentasjoner }),
    },
    { headers: config.cacheControlHeaders }
  );
};
export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return loaderHeaders;
};

export const meta: MetaFunction = () => ({
  title: "Presentasjoner",
});

export default function Index() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <h1>Presentasjoner</h1>
      <ul>
        {data.presentasjoner.map((presentasjon) => (
          <li key={presentasjon.id}>
            <Link to={slugify(getTitle(presentasjon))} prefetch="intent">
              {getTitle(presentasjon)}
            </Link>
          </li>
        ))}
      </ul>
      <Debug debugData={data.debugData} />
    </>
  );
}
