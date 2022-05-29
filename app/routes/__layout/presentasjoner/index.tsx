import {
  HeadersFunction,
  json,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getPresentasjoner, getTitle, slugify } from "~/service/notion";
import { DatabasePage } from "~/service/notion-api.server";
import Debug from "~/components/debug";
import config from "~/config.server";
import { maybePrepareDebugData } from "~/components/debug.server";

type Data = { presentasjoner: DatabasePage[]; debugData?: string };
export const loader: LoaderFunction = async ({ request }) => {
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
  const data = useLoaderData<Data>();
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
