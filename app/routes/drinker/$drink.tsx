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
      drink,
      debugData: await maybePrepareDebugData(request, { drink, blocks }),
    },
    { headers: config.cacheControlHeadersDynamic(page.last_edited_time) }
  );
};

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return loaderHeaders;
};

export const meta: MetaFunction = ({ data }: { data: Data }) => {
  return {
    title: data.drink.Tittel,
  };
};

export default function DrinkView() {
  const data = useLoaderData<Data>();
  return (
    <div className="max-w-lg md:max-w-4xl mx-auto">
      {/* <h1 className="text-xl italic">{data.drink.Tittel}</h1> */}
      <div className="flex flex-col gap-20 mt-14">
        {data.drink.Forberedelser && (
          <div>
            <h2 className="text-4xl font-semibold">Forberedelser</h2>
            <NotionRender blocks={data.drink.Forberedelser} />
          </div>
        )}

        <div className="flex">
          <div className="w-1/2 lg:w-1/3">
            <h2 className="text-4xl font-semibold">Ingredienser</h2>
            <NotionRender blocks={data.drink.Ingredienser} />
          </div>
          {data.drink.Illustrasjon && (
            <div className="w-1/2 lg:w-2/3 h-72 lg:h-96 relative">
              <img
                className="absolute inset-0 h-full w-full object-cover object-top"
                src={optimizedImageUrl(data.drink.Illustrasjon)}
              />
            </div>
          )}
        </div>

        <div>
          <h2 className="text-4xl font-semibold">Fremgangsmåte</h2>
          <NotionRender blocks={data.drink.Fremgangsmåte} />
        </div>

        <div>
          <div></div>
        </div>
        <div></div>
      </div>

      {data.drink.Referanser && (
        <div>
          <h2 className="text-4xl font-semibold">Referanser</h2>
          <div className="flex flex-wrap gap-10">
            <NotionRender
              blocks={data.drink.Referanser}
              components={notionRenderComponents}
            />
          </div>
        </div>
      )}

      <Debug debugData={data.debugData} />
    </div>
  );
}