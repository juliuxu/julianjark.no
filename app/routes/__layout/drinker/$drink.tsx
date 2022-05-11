import {
  LoaderFunction,
  json,
  MetaFunction,
  HeadersFunction,
} from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import {
  findPageBySlugPredicate,
  getDrinker,
  getTextFromRichText,
  getTitle,
} from "~/service/notion";
import {
  DatabasePage,
  getBlocksWithChildren,
} from "~/service/notionApi.server";
import { assertItemFound, optimizedImageUrl, takeWhileM } from "~/common";

import { Block } from "~/service/notion.types";
import config from "~/config.server";
import Debug from "~/components/debug";
import NotionRender from "~/packages/notion-render";

type Drink = {
  Ingredienser: Block[];
  Fremgangsmåte: Block[];
  Notes: Block[];
  References: Block[];
};
const prepare = (page: DatabasePage, blocks: Block[]): Partial<Drink> => {
  const inner = (blocksInnerOrg: Block[]) => {
    const blocksInner = blocksInnerOrg.slice();

    const result: Partial<Drink> = {};
    let block: Block | undefined;
    while ((block = blocksInner.shift()) !== undefined) {
      // Notes
      if (block.type === "callout") {
        result.Notes = [...(result.Notes ?? []), block];
        continue;
      }

      // References
      const referenceBlockTypes: Block["type"][] = [
        "bookmark",
        "video",
        "image",
      ];
      if (referenceBlockTypes.includes(block.type)) {
        result.References = [...(result.References ?? []), block];
        continue;
      }

      if (
        (block as any)[block.type]?.children &&
        (block as any)[block.type]?.children.length > 0
      ) {
        // Recursive
        const recursiveResult = inner((block as any)[block.type].children);

        // Manual merge
        result.Notes = (result.Notes ?? []).concat(recursiveResult.Notes ?? []);
        result.References = (result.References ?? []).concat(
          recursiveResult.References ?? []
        );

        if (recursiveResult.Ingredienser)
          result.Ingredienser = recursiveResult.Ingredienser;
        if (recursiveResult.Fremgangsmåte)
          result.Fremgangsmåte = recursiveResult.Fremgangsmåte;

        continue;
      }

      const getItemsIfHeader = (header: string, block: Block) => {
        const headingBlockTypes: Block["type"][] = [
          "heading_1",
          "heading_2",
          "heading_3",
        ];
        if (
          headingBlockTypes.includes(block.type) &&
          getTextFromRichText((block as any)[block.type].rich_text).includes(
            header
          )
        ) {
          return takeWhileM(
            blocksInner,
            (x) => !headingBlockTypes.includes(x.type)
          );
        }
        return undefined;
      };
      const Ingredienser = getItemsIfHeader("Ingredienser", block);
      const Fremgangsmåte = getItemsIfHeader("Fremgangsmåte", block);
      if (Ingredienser) result.Ingredienser = Ingredienser;
      if (Fremgangsmåte) result.Fremgangsmåte = Fremgangsmåte;
    }
    return result;
  };
  return inner(blocks);
};

interface Data {
  page: DatabasePage;
  blocks: Block[];
  drink: Drink;
}
export const loader: LoaderFunction = async ({ params }) => {
  const page = (await getDrinker()).find(
    findPageBySlugPredicate(params.drink ?? "")
  );
  assertItemFound(page);

  const blocks = await getBlocksWithChildren(page.id);

  const drink = prepare(page, blocks) as Required<Drink>;

  return json<Data>(
    { page, blocks, drink },
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

  // Illustration
  let illustrationUrl: string | undefined;
  if (data.page.cover?.type === "external") {
    illustrationUrl = data.page.cover.external.url;
  } else if (data.page.cover?.type === "file") {
    illustrationUrl = data.page.cover.file.url;
  }

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
        {illustrationUrl && (
          <div>
            <img src={optimizedImageUrl(illustrationUrl)} />
          </div>
        )}
      </div>

      <Debug pageData={data.page} />
    </>
  );
}
