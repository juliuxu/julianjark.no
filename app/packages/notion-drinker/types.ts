import { Block, SelectColor } from "~/notion/notion.types";

export type DrinkHeader = {
  Tittel: string;
  Alkohol: string;
  alcohol: Alcohol; // New API
  Tags: string[];
  groups: string[];
  Illustrasjon: string;
  IllustrasjonPosisjon: "top" | "center";
};
export type DrinkBody = {
  Forberedelser?: Block[];
  Ingredienser: Block[];
  Fremgangsmåte: Block[];
  Notater?: Block[];
  Referanser?: Block[];
};

export type Drink = DrinkHeader & DrinkBody;

export type Alcohol = {
  title: string;
  color: SelectColor;
};

export function assertDrink(drink: Partial<Drink>): asserts drink is Drink {
  assertObjectByKeys(
    drink,
    [
      "Tittel",
      "Alkohol",
      "alcohol",
      "Tags",
      "groups",
      "Illustrasjon",
      "IllustrasjonPosisjon",
      "Ingredienser",
      "Fremgangsmåte",
    ],
    (missingKeys) =>
      `${missingKeys
        .map((x) => `"${x}"`)
        .join(",")} mangler fra drinken i Notion\n${JSON.stringify(
        drink.Tittel,
        null,
        2
      )}`
  );
}

export function assertDrinkHeader(
  drinkHeader: Partial<DrinkHeader>
): asserts drinkHeader is DrinkHeader {
  assertObjectByKeys(
    drinkHeader,
    [
      "Tittel",
      "Alkohol",
      "alcohol",
      "Tags",
      "groups",
      "Illustrasjon",
      "IllustrasjonPosisjon",
    ],
    (missingKeys) =>
      `${missingKeys
        .map((x) => `"${x}"`)
        .join(",")} mangler fra drinken i Notion\n${JSON.stringify(
        drinkHeader.Tittel,
        null,
        2
      )}`
  );
}

export function assertObjectByKeys<T extends object>(
  object: Partial<T>,
  keys: Array<keyof T>,
  errorMessage: (missingKeys: Array<keyof T>) => string
): asserts object is T {
  const missingKeys = keys.filter((key) => object[key] === undefined);
  if (missingKeys.length > 0)
    throw new Response(errorMessage(missingKeys), {
      status: 500,
    });
}
