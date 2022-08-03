import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import config from "~/config.server";
import { getDrinker, getDrinkerDatabase } from "~/notion/notion";
import { getTextFromRichText } from "~/notion/notion";
import type { BlockWithChildren } from "~/notion/notion.types";
import type { DatabasePage } from "~/notion/notion-api.server";
import { getBlocksWithChildren, getPage } from "~/notion/notion-api.server";
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
  raw: string;
  title: string;
  recommendation?: string;
  amount?: string;
  mlAmount?: string;
}
interface Step {
  title: string;
}
interface Drank {
  id: string;
  title: string;
  alcohol: string;
  tags: string[];
  ingredients: Ingredient[];
  illustrationUrl: string;
  illustrationPosition: "top" | "center";
  steps: Step[];
  lastUpdated: string;
}

export const loader = async ({ request }: LoaderArgs) => {
  // Single Drank
  const drankId = new URL(request.url).searchParams.get("id");
  if (drankId !== null && drankId.length > 0) {
    const drinkPage = await getPage(drankId);
    const drinkBlocks = await getBlocksWithChildren(drinkPage.id);
    const drank = prepare(drinkPage, drinkBlocks);
    return json(drank, {
      headers: config.cacheControlHeadersDynamic(drank.lastUpdated),
    });
  }

  console.time("fetching database and pages");
  const [drinkerDatabase, drinker] = await Promise.all([
    getDrinkerDatabase(),
    getDrinker(),
  ] as const);
  console.timeEnd("fetching database and pages");

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

  if (drinkerDatabase.properties["Alkohol"].type !== "select")
    throw new Error("Database mangler Alkohol");
  const alcoholOrder = drinkerDatabase.properties["Alkohol"].select.options.map(
    (x) => x.name,
  );

  return json(
    { dranks, alcoholOrder, lastUpdated },
    { headers: config.cacheControlHeadersDynamic(lastUpdated) },
  );
};

const prepare = (page: DatabasePage, blocks: BlockWithChildren[]): Drank => {
  // Piggyback on the notion-drinker prepare
  const drink = notionDrinkerPrepare(page, blocks);
  assertDrink(drink);

  const ingredients = drink.Ingredienser.filter(
    (block) =>
      block.type === "bulleted_list_item" ||
      block.type === "numbered_list_item",
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
    .map((s) => s.trim())
    .map((s) => {
      const regex =
        /^((?<amount>[\d.-]+[\s\w]*?)\s)?(?<mlAmount>\([\d-]+ml\))?\s?(?<title>[A-ZÆØÅ].+?)(\s—\s(?<recommendation>.+))?$/;
      const matches = s.match(regex);
      if (
        matches?.groups === undefined ||
        typeof matches.groups.title !== "string"
      )
        throw new Error(`could not parse ${s}`);

      return { raw: s, ...matches.groups } as Ingredient;
    });

  const steps = drink.Fremgangsmåte.filter(
    (block) =>
      block.type === "bulleted_list_item" ||
      block.type === "numbered_list_item",
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
    .map((s) => s.trim())
    .map((s) => {
      return { title: s };
    });

  return {
    id: page.id,
    title: drink.Tittel,
    alcohol: drink.Alkohol,
    tags: drink.Tags,
    illustrationUrl: drink.Illustrasjon,
    illustrationPosition: drink.IllustrasjonPosisjon,
    ingredients,
    steps,
    lastUpdated: page.last_edited_time,
  };
};
