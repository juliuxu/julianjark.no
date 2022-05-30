import {
  LoaderFunction,
  json,
  MetaFunction,
  HeadersFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { findPageBySlugPredicate, getDrinker, getTitle } from "~/notion/notion";
import {
  DatabasePage,
  getBlocksWithChildren,
} from "~/notion/notion-api.server";
import { assertItemFound, optimizedImageUrl } from "~/utils";

import config from "~/config.server";
import Debug from "~/components/debug";
import NotionRender from "~/packages/notion-render";
import type { Components as NotionRenderComponents } from "~/packages/notion-render/components";
import { OptimizedNotionImage } from "~/components/notion-components";
import { maybePrepareDebugData } from "~/components/debug.server";
import { assertDrink, Drink } from "~/packages/notion-drinker/types";
import { prepare } from "~/packages/notion-drinker/prepare.server";

export const notionRenderComponents: Partial<NotionRenderComponents> = {
  image: OptimizedNotionImage,
};

interface Data {
  page: DatabasePage;
  drink: Drink;
  debugData?: string;
}
export const loader: LoaderFunction = async ({ request, params }) => {
  const page = (await getDrinker()).find(
    findPageBySlugPredicate(params.drink ?? "")
  );
  assertItemFound(page);

  const blocks = await getBlocksWithChildren(page.id);
  const drink = prepare(page, blocks);
  assertDrink(drink);

  return json<Data>(
    {
      page,
      drink,
      debugData: await maybePrepareDebugData(request, { drink, page, blocks }),
    },
    { headers: config.cacheControlHeadersDynamic(page.last_edited_time) }
  );
};

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return loaderHeaders;
};

export const meta: MetaFunction = ({ data }: { data: Data }) => {
  return {
    title: getTitle(data.page),
  };
};

export default function DrinkView() {
  const data = useLoaderData<Data>();

  return (
    <>
      <h1>{getTitle(data.page)}</h1>
      <div className="grid">
        <div>
          <div className="grid">
            <div>
              <h2>Ingredienser</h2>
              <NotionRender blocks={data.drink.Ingredienser} />
            </div>
            <div>
              <h2>Fremgangsmåte</h2>
              <NotionRender blocks={data.drink.Fremgangsmåte} />
            </div>
          </div>
        </div>
        {data.drink.Illustrasjon && (
          <div>
            <img src={optimizedImageUrl(data.drink.Illustrasjon)} />
          </div>
        )}
      </div>

      {data.drink.Referanser && (
        <>
          <details style={{ marginTop: 16 }}>
            <summary>Referanser</summary>
            <NotionRender
              blocks={data.drink.Referanser}
              components={notionRenderComponents}
            />
          </details>
        </>
      )}

      <Debug debugData={data.debugData} />
    </>
  );
}
