import type {
  HeadersFunction,
  LoaderArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import Debug from "~/components/debug";
import { maybePrepareDebugData } from "~/components/debug.server";
import { OptimizedNotionImage } from "~/components/notion-components";
import config from "~/config.server";
import { findPageBySlugPredicate, getDrinker, getTitle } from "~/notion/notion";
import { getBlocksWithChildren } from "~/notion/notion-api.server";
import { prepare } from "~/packages/notion-drinker/prepare.server";
import { assertDrink } from "~/packages/notion-drinker/types";
import NotionRender from "~/packages/notion-render";
import type { Components as NotionRenderComponents } from "~/packages/notion-render/components";
import { assertItemFound, optimizedImageUrl } from "~/utils";

export const notionRenderComponents: Partial<NotionRenderComponents> = {
  image: OptimizedNotionImage,
};

export const loader = async ({ request, params }: LoaderArgs) => {
  const page = (await getDrinker()).find(
    findPageBySlugPredicate(params.drink ?? ""),
  );
  assertItemFound(page);

  const blocks = await getBlocksWithChildren(page.id);
  const drink = prepare(page, blocks);
  assertDrink(drink);

  return json(
    {
      page,
      drink,
      debugData: await maybePrepareDebugData(request, { drink, page, blocks }),
    },
    { headers: config.cacheControlHeadersDynamic(page.last_edited_time) },
  );
};

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  return loaderHeaders;
};

export const meta: MetaFunction = ({ data }) => {
  return {
    title: getTitle(data.page),
  };
};

export default function DrinkView() {
  const data = useLoaderData<typeof loader>();

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
            <img src={optimizedImageUrl(data.drink.Illustrasjon)} alt="" />
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
