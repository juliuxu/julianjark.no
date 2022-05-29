import { Block } from "~/notion/notion.types";

export type Drink = {
  Tittel: string;
  Forberedelser?: Block[];
  Illustrasjon: string;
  Ingredienser: Block[];
  Fremgangsmåte: Block[];
  Notater?: Block[];
  Referanser?: Block[];
};
export function assertDrink(drink: Partial<Drink>): asserts drink is Drink {
  const keys: Array<keyof Drink> = [
    "Tittel",
    "Illustrasjon",
    "Ingredienser",
    "Fremgangsmåte",
  ];
  const missingKeys = keys.filter((key) => !(key in drink));
  if (missingKeys.length > 0)
    throw new Response(
      `${missingKeys
        .map((x) => `"${x}"`)
        .join(",")} mangler fra drinken i Notion`,
      {
        status: 500,
      }
    );
}
