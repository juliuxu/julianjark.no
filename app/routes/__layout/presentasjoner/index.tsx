import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getPresentasjoner, getTitle, slugify } from "~/service/notion";
import { DatabasePage } from "~/service/notionApi.server";
import Debug from "~/components/debug";
import config from "~/config.server";

type Data = { presentasjoner: DatabasePage[] };
export const loader: LoaderFunction = async () => {
  const presentasjoner = await getPresentasjoner();

  return json(
    {
      presentasjoner,
    },
    { headers: config.cacheControlHeaders }
  );
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
      <Debug pageData={data.presentasjoner} />
    </>
  );
}
