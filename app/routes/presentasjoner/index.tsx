import {
  json,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getPresentasjoner, getTitle, slugify } from "~/service/notion";
import { DatabasePage } from "~/service/notionApi.server";
import TopLevelMenu, {
  loader as topLevelMenuLoader,
} from "~/components/topLevelMenu";
import { commonLinks } from "~/common";
import Debug from "~/components/debug";

export const loader: LoaderFunction = async () => {
  const presentasjoner = await getPresentasjoner();

  return json({
    presentasjoner,
    ...(await topLevelMenuLoader()),
  });
};

export const meta: MetaFunction = () => ({
  title: "Presentasjoner",
});
export const links: LinksFunction = () => [...commonLinks()];

export default function Index() {
  const data = useLoaderData();
  const presentasjoner = data.presentasjoner as DatabasePage[];
  return (
    <>
      <TopLevelMenu sitemapTree={data.sitemapTree} />
      <main>
        <h1>Presentasjoner</h1>
        <ul>
          {presentasjoner.map((presentasjon) => (
            <li key={presentasjon.id}>
              <Link to={slugify(getTitle(presentasjon))}>
                {getTitle(presentasjon)}
              </Link>
            </li>
          ))}
        </ul>
        <Debug pageData={presentasjoner} />
      </main>
    </>
  );
}
