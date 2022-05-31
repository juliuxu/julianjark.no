import {
  LoaderFunction,
  json,
  MetaFunction,
  HeadersFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { findPageBySlugPredicate, getDrinker } from "~/notion/notion";
import { getBlocksWithChildren } from "~/notion/notion-api.server";
import { assertItemFound, optimizedImageUrl } from "~/utils";

import config from "~/config.server";
import NotionRender from "~/packages/notion-render";
import type { Components as NotionRenderComponents } from "~/packages/notion-render/components";
import { OptimizedNotionImage } from "~/components/notion-components";
import { assertDrink, Drink } from "~/packages/notion-drinker/types";
import { prepare } from "~/packages/notion-drinker/prepare.server";

export const notionRenderComponents: Partial<NotionRenderComponents> = {
  image: OptimizedNotionImage,
};

interface Data {
  drink: Drink;
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

  const menuItems = [
    data.drink.Forberedelser ? "Forberedelser" : "",
    data.drink.Ingredienser ? "Ingredienser" : "",
    data.drink.Fremgangsmåte ? "Fremgangsmåte" : "",
    data.drink.Notater ? "Notater" : "",
    data.drink.Referanser ? "Referanser" : "",
  ].filter(Boolean);

  return (
    <div className="max-w-lg lg:max-w-6xl mx-auto pt-10 lg:flex lg:gap-x-16">
      {/* <h1 className="text-xl italic">{data.drink.Tittel}</h1> */}

      <aside className="hidden self-start sticky top-10 lg:block lg:w-1/4 py-7 px-12 border">
        <div className="text-lg font-semibold">Innhold</div>
        <ul className="mt-8 space-y-4">
          {menuItems.map((item) => (
            <li key={item}>
              <a
                className="block p-4 hover:bg-gray-50 before:content-['▪'] before:left-0 before:absolute relative"
                href={`#${item}`}
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex flex-col gap-20 lg:w-3/4">
        {data.drink.Forberedelser && (
          <div className="relative">
            <div id="Forberedelser" className="absolute -top-10" />
            <h2 className="text-4xl mb-8 font-semibold">Forberedelser</h2>
            <NotionRender blocks={data.drink.Forberedelser} />
          </div>
        )}

        <div className="flex relative">
          <div className="w-1/2 lg:w-1/3">
            <div id="Ingredienser" className="absolute -top-10" />
            <h2 className="text-4xl mb-8 font-semibold">Ingredienser</h2>
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

        <div className="relative">
          <div id="Fremgangsmåte" className="absolute -top-10" />
          <h2 className="text-4xl mb-8 font-semibold">Fremgangsmåte</h2>
          <NotionRender blocks={data.drink.Fremgangsmåte} />
        </div>

        {data.drink.Notater && (
          <div className="relative">
            <div id="Notater" className="absolute -top-10" />
            <h2 className="text-4xl mb-8 font-semibold">Notater</h2>
            <div className="flex flex-wrap gap-10">
              <NotionRender
                blocks={data.drink.Notater}
                components={notionRenderComponents}
              />
            </div>
          </div>
        )}

        {data.drink.Referanser && (
          <div className="relative">
            <div id="Referanser" className="absolute -top-10" />
            <h2 className="text-4xl mb-8 font-semibold">Referanser</h2>
            <div className="flex flex-wrap gap-10">
              <NotionRender
                blocks={data.drink.Referanser}
                components={notionRenderComponents}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
