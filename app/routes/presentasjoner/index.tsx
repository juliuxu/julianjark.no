import { json, LinksFunction, LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getPresentasjoner, getTitle, slugify } from "~/service/notion";
import { DatabasePage } from "~/service/notionApi.server";
import TopLevelMenu, {
  loader as topLevelMenuLoader,
} from "~/components/topLevelMenu";
import { CollapsedCode } from "~/components/code";
import { commonLinks } from "~/common";

export const loader: LoaderFunction = async () => {
  const presentasjoner = await getPresentasjoner();

  return json({
    presentasjoner,
    topLevelMenuData: await topLevelMenuLoader(),
  });
};

export const links: LinksFunction = () => [...commonLinks()];

export default function Index() {
  const data = useLoaderData();
  const presentasjoner = data.presentasjoner as DatabasePage[];
  return (
    <>
      <TopLevelMenu topLevelPages={data.topLevelMenuData} />
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
        <CollapsedCode
          language="json"
          code={JSON.stringify(presentasjoner, null, 2)}
        />
      </main>
    </>
  );
}
