import type { Lang, Theme } from "shiki";
import * as shiki from "shiki";

import type { Block } from "~/notion/notion.types";
import { getPlainTextFromRichTextList } from "~/packages/notion-render/components";

interface LineOption {
  line: number;
  classes?: string[];
}
export interface Options {
  lang: Lang;
  theme?: Theme;
  lineOptions?: LineOption[];
}

export default async function prepare(codeText: string, options: Options) {
  const highlighter = await shiki.getHighlighter({ theme: options.theme });
  return highlighter.codeToHtml(codeText, options);
}

const parseCaption = (
  caption: string,
): {
  language?: string;
  filename?: string;
  linenumbers?: string;
  highlight?: string;
  copy?: string;
} => {
  const params = Object.fromEntries(new URLSearchParams(caption));
  return params as Partial<typeof params>;
};

const prepareNotionBlock = async (
  block: Block,
  highlighter: shiki.Highlighter,
) => {
  if (block.type !== "code") return;

  const { language, filename, linenumbers, copy, highlight } = parseCaption(
    getPlainTextFromRichTextList(block.code.caption),
  );

  const lineOptions: LineOption[] = [];
  if (highlight) {
    // parse
    // comma seperated
    // case 1: single number
    // case 2: range
    // e.g. 1,4,7-10
    const highlightLines = highlight
      .split(",")
      .flatMap((section) => {
        const split = section.split("-");
        // case 1: single number
        if (split.length === 1) return Number.parseInt(split[0]);

        // case 2: range
        const first = Number.parseInt(split[0]);
        const second = Number.parseInt(split[1]);
        if (!Number.isInteger(first) || !Number.isInteger(second)) return NaN;

        return [...Array(second - first + 1).keys()].map((x) => x + first);
      })
      .filter(Number.isInteger);

    highlightLines.forEach((line) => {
      lineOptions.push({ line, classes: ["highlight"] });
    });
  }

  let shikiCodeHtml = highlighter.codeToHtml(
    getPlainTextFromRichTextList(block.code.rich_text),
    { lang: language ?? block.code.language, lineOptions },
  );

  // We could create our own renderer, probably better
  if (filename) {
    shikiCodeHtml = shikiCodeHtml.replace(
      `<pre`,
      `<pre data-filename="${filename}"`,
    );
  }
  if (copy === "true") {
    shikiCodeHtml = shikiCodeHtml.replace(`<pre`, `<pre data-copy="true"`);
  }
  if (linenumbers === "true") {
    shikiCodeHtml = shikiCodeHtml.replace(
      `<pre`,
      `<pre data-line-numbers="true"`,
    );
  }

  (block.code as any).shikiCodeHtml = shikiCodeHtml;
};

// Mutates the given list
// TODO: Update psuedo ListBlock block.bullet_list.children instead of block.children
export const prepareNotionBlocks = async (
  blocks: Block[],
  options: Omit<Options, "lang">,
) => {
  const highlighter = await shiki.getHighlighter({ theme: options.theme });

  const innerF = (innerBlocks: Block[]) =>
    innerBlocks.forEach((block) => {
      prepareNotionBlock(block, highlighter);
      if (block.has_children) {
        innerF((block as any)[block.type]?.children ?? []);
      }
    });
  innerF(blocks);
};
