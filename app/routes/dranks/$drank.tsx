import type {
  HeadersFunction,
  LoaderArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { buildOptimizedNotionImage } from "~/components/notion-components";
import { OptimizedImage } from "~/components/optimized-image";
import config from "~/config.server";
import {
  fetchDranksImageResources,
  findPageBySlugPredicate,
  getDrinker,
} from "~/notion/notion";
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
    findPageBySlugPredicate(params.drank ?? ""),
  );
  assertItemFound(page);

  const blocks = await getBlocksWithChildren(page.id);
  const drink = prepare(page, blocks);
  assertDrink(drink);

  const images = await fetchDranksImageResources(["appelsiner"]);

  return json(
    {
      drink,
      images,
    },
    { headers: config.cacheControlHeadersDynamic(page.last_edited_time) },
  );
};
export let headers: HeadersFunction = ({ loaderHeaders }) => loaderHeaders;

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
    <div className="max-w-sm sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-6xl mx-auto flex flex-col gap-16 py-16">
      <h1 className="text-5xl text-orange font-comico italic">
        {data.drink.Tittel}
      </h1>

      <div className="flex flex-col gap-14">
        {data.drink.Forberedelser && (
          <div>
            <div id="Forberedelser" className="absolute -top-10" />
            <h2 className="text-2xl text-orange mb-5">Forberedelser</h2>
            <NotionRender blocks={data.drink.Forberedelser} />
          </div>
        )}

        <div className="flex justify-between">
          <div className="flex flex-col gap-14 w-1/2 lg:w-1/3">
            <div>
              <h2 className="text-2xl text-orange mb-5" id="Ingredienser">
                Du trenger
              </h2>
              <NotionRender blocks={data.drink.Ingredienser} />
            </div>

            <div>
              <h2 className="text-2xl text-orange mb-5" id="Fremgangsmåte">
                Fremgangsmåte
              </h2>
              <NotionRender blocks={data.drink.Fremgangsmåte} />
            </div>

            {data.drink.Notater && (
              <div>
                <h2 className="text-2xl text-orange mb-5" id="Notater">
                  Notater
                </h2>
                <div className="flex flex-wrap gap-10">
                  <NotionRender
                    blocks={data.drink.Notater}
                    components={notionRenderComponents}
                  />
                </div>
              </div>
            )}
          </div>

          {false && data.drink.Illustrasjon && (
            <div className="w-1/2 lg:w-2/3 h-72 lg:h-96 relative">
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
          <OptimizedImage {...data.images.appelsiner} className="-mt-12" />
        </div>

        {data.drink.Referanser && (
          <div>
            <h2 className="text-2xl text-orange mb-5" id="Referanser">
              Referanser
            </h2>
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
