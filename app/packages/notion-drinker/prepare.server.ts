import {
  getMultiSelect,
  getSelect,
  getSelectAndColor,
  getTextFromRichText,
  getTitle,
} from "~/notion/notion";
import type { Block } from "~/notion/notion.types";
import type { DatabasePage } from "~/notion/notion-api.server";
import {
  getOneOfOrUndefined,
  rewriteNotionImageUrl,
  takeWhileM,
} from "~/utils";
import type { Drink, DrinkBody, DrinkHeader } from "./types";
import { Alcohol } from "./types";

export const prepareFromPage = (page: DatabasePage): Partial<DrinkHeader> => {
  // Illustration
  let Illustrasjon: string | undefined;
  if (page.cover?.type === "external") {
    Illustrasjon = page.cover.external.url;
  } else if (page.cover?.type === "file") {
    Illustrasjon = page.cover.file.url;
  }
  if (Illustrasjon !== undefined) {
    Illustrasjon = rewriteNotionImageUrl(Illustrasjon, page.id);
  }

  // Illustrasjon Posisjon
  const IllustrasjonPosisjon =
    getOneOfOrUndefined(
      ["top", "center"],
      getSelect("IllustrasjonPosisjon", page),
    ) ?? "center";

  // Tittel
  const Tittel = getTitle(page);

  // Alkohol
  const Alkohol = getSelect("Alkohol", page);
  const alcohol = getSelectAndColor("Alkohol", page);

  // Tags
  const Tags = getMultiSelect("Tags", page);

  // Groups
  const groups = getMultiSelect("Gruppering", page);

  return {
    Illustrasjon,
    IllustrasjonPosisjon,
    Tittel,
    Alkohol,
    alcohol,
    Tags,
    groups,
  };
};

export const prepareFromBlocks = (blocks: Block[]): Partial<DrinkBody> => {
  const blocksInner = blocks.slice();

  const result: Partial<Drink> = {};
  let block: Block | undefined;
  while ((block = blocksInner.shift()) !== undefined) {
    // Notes
    if (block.type === "callout") {
      result.Notater = [...(result.Notater ?? []), block];
      continue;
    }

    // References
    const referenceBlockTypes: Block["type"][] = ["bookmark", "video", "image"];
    if (referenceBlockTypes.includes(block.type)) {
      result.Referanser = [...(result.Referanser ?? []), block];
      continue;
    }

    if (
      (block as any)[block.type]?.children &&
      (block as any)[block.type]?.children.length > 0
    ) {
      // Recursive
      const recursiveResult = prepareFromBlocks(
        (block as any)[block.type].children,
      );

      // Manual merge
      result.Notater = recursiveResult.Notater
        ? [...(result.Notater ?? []), ...recursiveResult.Notater]
        : result.Notater;

      result.Referanser = recursiveResult.Referanser
        ? [...(result.Referanser ?? []), ...recursiveResult.Referanser]
        : result.Referanser;

      if (recursiveResult.Forberedelser)
        result.Forberedelser = recursiveResult.Forberedelser;
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
          header,
        )
      ) {
        return takeWhileM(
          blocksInner,
          (x) => !headingBlockTypes.includes(x.type),
        );
      }
      return undefined;
    };
    const Forbredelser = getItemsIfHeader("Forbredelser", block);
    const Ingredienser = getItemsIfHeader("Ingredienser", block);
    const Fremgangsmåte = getItemsIfHeader("Fremgangsmåte", block);
    if (Forbredelser) result.Forberedelser = Forbredelser;
    if (Ingredienser) result.Ingredienser = Ingredienser;
    if (Fremgangsmåte) result.Fremgangsmåte = Fremgangsmåte;
  }
  return result;
};

export const prepare = (
  page: DatabasePage,
  blocks: Block[],
): Partial<Drink> => {
  return {
    ...prepareFromPage(page),
    ...prepareFromBlocks(blocks),
  };
};
