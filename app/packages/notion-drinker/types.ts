import { Block } from "~/notion/notion.types";

export type Drink = {
  Forbredelser: Block[];
  Illustrasjon: string;
  Ingredienser: Block[];
  Fremgangsmåte: Block[];
  Notater: Block[];
  Referanser: Block[];
};
