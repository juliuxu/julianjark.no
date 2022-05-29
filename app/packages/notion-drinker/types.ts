import { Block } from "~/notion/notion.types";

export type Drink = {
  Illustration: string;
  Ingredienser: Block[];
  Fremgangsmåte: Block[];
  Notes: Block[];
  References: Block[];
};
