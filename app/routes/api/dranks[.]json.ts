import { LoaderFunction, json } from "@remix-run/node";
import config from "~/config.server";
import { getDrinker } from "~/notion/notion";
import {
  DatabasePage,
  getBlocksWithChildren,
} from "~/notion/notion-api.server";
import { getTextFromRichText } from "~/notion/notion";
import { BlockWithChildren } from "~/notion/notion.types";
import { prepare as notionDrinkerPrepare } from "~/packages/notion-drinker/prepare.server";
import { assertDrink } from "~/packages/notion-drinker/types";
import { chunked } from "~/utils";

/**
 * Dranks data structure
 * derived on the Drink structure from Notion
 * A drink is in the notion/julianjark.no domain
 * A drank is in the app domain
 */
interface Ingredient {
  title: string;
  recommendation?: string;
  amount?: string;
}
interface Step {
  text: string;
}
interface Drank {
  title: string;
  ingredients: Ingredient[];
  steps: Step[];
  lastUpdated: string;
  body?: any;
}
interface Data {
  lastUpdated?: string;
  dranks: Drank[];
}
export const loader: LoaderFunction = async () => {
  console.time("fetching drinker");
  const drinker = await getDrinker();
  console.timeEnd("fetching drinker");

  console.time("fetching drinker blocks");
  let dranks: Drank[] = [];
  for (let chunk of chunked(drinker, 5)) {
    console.time(`fetching ${chunk.length} drinks`);
    const drankPromises = chunk.map(async (drink) => {
      const drinkBlocks = await getBlocksWithChildren(drink.id);
      return prepare(drink, drinkBlocks);
    });
    const dranksChunk = await Promise.all(drankPromises);
    console.timeEnd(`fetching ${chunk.length} drinks`);
    dranks.push(...dranksChunk);
  }
  console.timeEnd("fetching drinker blocks");

  const lastUpdated = dranks
    .map((x) => x.lastUpdated)
    .sort()
    .reverse()[0];
  return json<Data>(
    { dranks, lastUpdated },
    { headers: config.cacheControlHeadersDynamic(lastUpdated) }
  );
};

const prepare = (page: DatabasePage, blocks: BlockWithChildren[]): Drank => {
  // Piggyback on the notion-drinker prepare
  const drink = notionDrinkerPrepare(page, blocks);
  assertDrink(drink);

  const ingredients = drink.Ingredienser.filter(
    (block) =>
      block.type === "bulleted_list_item" || block.type === "numbered_list_item"
  )
    .map((block) => {
      if (block.type === "bulleted_list_item") {
        return getTextFromRichText(block.bulleted_list_item.rich_text);
      }
      if (block.type === "numbered_list_item") {
        return getTextFromRichText(block.numbered_list_item.rich_text);
      }
      return "";
    })
    .map((s) => {
      // TODO: Split out amount and recommendation
      return { title: s };
    });

  const steps = drink.Fremgangsmåte.filter(
    (block) =>
      block.type === "bulleted_list_item" || block.type === "numbered_list_item"
  )
    .map((block) => {
      if (block.type === "bulleted_list_item") {
        return getTextFromRichText(block.bulleted_list_item.rich_text);
      }
      if (block.type === "numbered_list_item") {
        return getTextFromRichText(block.numbered_list_item.rich_text);
      }
      return "";
    })
    .map((s) => {
      return { text: s };
    });

  return {
    title: drink.Tittel,
    ingredients,
    steps,
    lastUpdated: page.last_edited_time,
  };
};
