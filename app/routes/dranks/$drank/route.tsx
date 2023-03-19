import type {
  HeadersFunction,
  LinksFunction,
  LoaderArgs,
  V2_MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { Image } from "@unpic/react";

import { OptimizedNotionImage } from "~/components/notion-components";
import { notionRenderClasses } from "~/components/notion-render-config";
import config from "~/config";
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
import type { SitemapHandle } from "~/packages/remix-sitemap/sitemap.server";
import { databaseEntryToSitemapEntry } from "~/sitemap.server";
import comicoFont from "~/styles/fonts/Comico-Regular.woff2";
import satohshiFont from "~/styles/fonts/Satoshi-Variable.woff2";
import { assertItemFound, unpicTransformer } from "~/utils";
import { dranksClasses } from "../route";

export const notionRenderComponents: Partial<NotionRenderComponents> = {
  image: OptimizedNotionImage,
};

export const handle: SitemapHandle = {
  getSitemapEntries: async () =>
    (await getDrinker()).map(databaseEntryToSitemapEntry),
};

export const links: LinksFunction = () => [
  {
    rel: "preload",
    href: comicoFont,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
  {
    rel: "preload",
    href: satohshiFont,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
];

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
    {
      headers: config.cacheControlHeadersDynamic(
        page.last_edited_time,
        60 * 60,
      ),
    },
  );
};
export let headers: HeadersFunction = ({ loaderHeaders }) => loaderHeaders;

export const meta: V2_MetaFunction = ({ data }) => [
  {
    title: data.drink.Tittel,
  },
];

const notionRenderConfig = {
  classes: notionRenderClasses,
  components: notionRenderComponents,
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
    <div
      className={`flex flex-col gap-16 py-16 ${dranksClasses.layoutPadding} ${dranksClasses.layoutMaxWidth}`}
    >
      <h1 className="text-orange font-comico text-5xl italic">
        {data.drink.Tittel}
      </h1>

      <div className="flex flex-col gap-14">
        {data.drink.Forberedelser && (
          <div>
            <div id="Forberedelser" className="absolute -top-10" />
            <h2 className="text-orange mb-5 text-2xl">Forberedelser</h2>
            <NotionRender
              {...notionRenderConfig}
              blocks={data.drink.Forberedelser}
            />
          </div>
        )}

        <div className="flex justify-between">
          <div className="flex w-2/3 flex-col gap-14">
            <div>
              <h2 className="text-orange mb-5 text-2xl" id="Ingredienser">
                Du trenger
              </h2>
              <NotionRender
                {...notionRenderConfig}
                blocks={data.drink.Ingredienser}
              />
            </div>

            <div>
              <h2 className="text-orange mb-5 text-2xl" id="Fremgangsmåte">
                Fremgangsmåte
              </h2>
              <NotionRender
                {...notionRenderConfig}
                blocks={data.drink.Fremgangsmåte}
              />
            </div>

            {data.drink.Notater && (
              <div>
                <h2 className="text-orange mb-5 text-2xl" id="Notater">
                  Notater
                </h2>
                <div className="flex flex-wrap gap-10">
                  <NotionRender
                    {...notionRenderConfig}
                    blocks={data.drink.Notater}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="relative w-1/3 overflow-visible">
            <Image
              layout="fullWidth"
              transformer={unpicTransformer}
              {...data.images.appelsiner}
              className="-mt-12"
            />
          </div>
        </div>

        {data.drink.Referanser && (
          <div>
            <h2 className="text-orange mb-5 text-2xl" id="Referanser">
              Referanser
            </h2>
            <div className="flex flex-wrap gap-10">
              <NotionRender
                {...notionRenderConfig}
                blocks={data.drink.Referanser}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
