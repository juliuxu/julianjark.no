import { Link, useLoaderData } from "@remix-run/react";
import type {
  HeadersFunction,
  LoaderArgs,
  MetaFunction,
} from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";

import Debug from "~/components/debug";
import { maybePrepareDebugData } from "~/components/debug.server";
import config from "~/config";
import { getPresentasjoner, getTitle, slugify } from "~/notion/notion";

export const loader = async ({ request }: LoaderArgs) => {
  const presentasjoner = await getPresentasjoner();

  return json(
    {
      presentasjoner,
      debugData: await maybePrepareDebugData(request, { presentasjoner }),
    },
    { headers: config.cacheControlHeaders },
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
