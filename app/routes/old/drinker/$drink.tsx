import type {
  HeadersFunction,
  LoaderArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { buildOptimizedNotionImage } from "~/components/notion-components";
import config from "~/config";
import { findPageBySlugPredicate, getDrinker } from "~/notion/notion";
import { getBlocksWithChildren } from "~/notion/notion-api.server";
import { prepare } from "~/packages/notion-drinker/prepare.server";
import { assertDrink } from "~/packages/notion-drinker/types";
import NotionRender from "~/packages/notion-render";
import type { Components as NotionRenderComponents } from "~/packages/notion-render/components";
import { assertItemFound, optimizedImageUrl } from "~/utils";

export const notionRenderComponents: Partial<NotionRenderComponents> = {
  image: buildOptimizedNotionImage(),
};

export const loader = async ({ params }: LoaderArgs) => {
  const page = (await getDrinker()).find(
    findPageBySlugPredicate(params.drink ?? ""),
  );
  assertItemFound(page);

  const blocks = await getBlocksWithChildren(page.id);
  const drink = prepare(page, blocks);
  assertDrink(drink);

  return json(
    {
      drink,
    },
    { headers: config.cacheControlHeadersDynamic(page.last_edited_time) },
  );
};

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return loaderHeaders;
};

export const meta: MetaFunction = ({ data }) => {
  return {
    title: data.drink.Tittel,
  };
};

export default function DrinkView() {
  const data = useLoaderData<typeof loader>();

  const menuItems = [
    data.drink.Forberedelser ? "Forberedelser" : "",
    data.drink.Ingredienser ? "Ingredienser" : "",
    data.drink.Fremgangsmåte ? "Fremgangsmåte" : "",
    data.drink.Notater ? "Notater" : "",
    data.drink.Referanser ? "Referanser" : "",
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-lg pt-10 lg:flex lg:max-w-6xl lg:gap-x-16">
      {/* <h1 className="text-xl italic">{data.drink.Tittel}</h1> */}

      <aside className="sticky top-10 hidden self-start border py-7 px-12 lg:block lg:w-1/4">
        <div className="text-lg font-semibold">Innhold</div>
        <ul className="mt-8 space-y-4">
          {menuItems.map((item) => (
            <li key={item}>
              <a
                className="relative block p-4 before:absolute before:left-0 before:content-['▪'] hover:bg-gray-50"
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
            <h2 className="mb-8 text-4xl font-semibold">Forberedelser</h2>
            <NotionRender blocks={data.drink.Forberedelser} />
          </div>
        )}

        <div className="relative flex">
          <div className="w-1/2 lg:w-1/3">
            <div id="Ingredienser" className="absolute -top-10" />
            <h2 className="mb-8 text-4xl font-semibold">Ingredienser</h2>
            <NotionRender blocks={data.drink.Ingredienser} />
          </div>
          {data.drink.Illustrasjon && (
            <div className="relative h-72 w-1/2 lg:h-96 lg:w-2/3">
              <img
                className={`absolute inset-0 h-full w-full object-cover ${
                  data.drink.IllustrasjonPosisjon === "top"
                    ? "object-top"
                    : "object-center"
                }`}
                src={optimizedImageUrl(data.drink.Illustrasjon)}
                alt=""
              />
            </div>
          )}
        </div>

        <div className="relative">
          <div id="Fremgangsmåte" className="absolute -top-10" />
          <h2 className="mb-8 text-4xl font-semibold">Fremgangsmåte</h2>
          <NotionRender blocks={data.drink.Fremgangsmåte} />
        </div>

        {data.drink.Notater && (
          <div className="relative">
            <div id="Notater" className="absolute -top-10" />
            <h2 className="mb-8 text-4xl font-semibold">Notater</h2>
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
            <h2 className="mb-8 text-4xl font-semibold">Referanser</h2>
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