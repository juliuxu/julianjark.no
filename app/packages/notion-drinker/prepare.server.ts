import { getTextFromRichText } from "~/notion/notion";
import { DatabasePage } from "~/notion/notion-api.server";
import type { Block } from "~/notion/notion.types";
import { takeWhileM } from "~/utils";
import { Drink } from "./types";

export const prepare = (
  page: DatabasePage,
  blocks: Block[]
): Partial<Drink> => {
  const inner = (blocksInnerOrg: Block[]) => {
    const blocksInner = blocksInnerOrg.slice();

    const result: Partial<Drink> = {};
    let block: Block | undefined;
    while ((block = blocksInner.shift()) !== undefined) {
      // Notes
      if (block.type === "callout") {
        result.Notater = [...(result.Notater ?? []), block];
        continue;
      }

      // References
      const referenceBlockTypes: Block["type"][] = [
        "bookmark",
        "video",
        "image",
      ];
      if (referenceBlockTypes.includes(block.type)) {
        result.Referanser = [...(result.Referanser ?? []), block];
        continue;
      }

      if (
        (block as any)[block.type]?.children &&
        (block as any)[block.type]?.children.length > 0
      ) {
        // Recursive
        const recursiveResult = inner((block as any)[block.type].children);

        // Manual merge
        result.Notater = (result.Notater ?? []).concat(
          recursiveResult.Notater ?? []
        );
        result.Referanser = (result.Referanser ?? []).concat(
          recursiveResult.Referanser ?? []
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

  // Illustration
  let illustrationUrl: string | undefined;
  if (page.cover?.type === "external") {
    illustrationUrl = page.cover.external.url;
  } else if (page.cover?.type === "file") {
    illustrationUrl = page.cover.file.url;
  }

  return { Illustrasjon: illustrationUrl, ...inner(blocks) };
};
