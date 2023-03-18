import type { Lang, Theme } from "shiki";

import type { Block } from "~/notion/notion.types";
import { getPlainTextFromRichTextList } from "~/packages/notion-render/components";
import { default as workerPrepare } from "./prepare.worker";

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
  return await workerPrepare({ codeText, options });
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
  options: Omit<Options, "lang">,
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

  let { codeHtml, foregroundColor, backgroundColor } = await prepare(
    getPlainTextFromRichTextList(block.code.rich_text),
    {
      ...options,
      lang: (language ?? block.code.language) as Lang,
      lineOptions,
    },
  );

  // Add foreground and background variables
  codeHtml = codeHtml.replace(
    `<pre class="shiki" style="`,
    `<pre class="shiki" style="--shiki-foreground: ${foregroundColor}; --shiki-background: ${backgroundColor};`,
  );

  // We could create our own renderer, probably better
  if (filename) {
    codeHtml = codeHtml.replace(`<pre`, `<pre data-filename="${filename}"`);
  }
  if (copy === "true") {
    codeHtml = codeHtml.replace(`<pre`, `<pre data-copy="true"`);
  }
  if (linenumbers === "true") {
    codeHtml = codeHtml.replace(`<pre`, `<pre data-line-numbers="true"`);
  }

  (block.code as any).codeHtml = codeHtml;
};

// Mutates the given list
// TODO: Update psuedo ListBlock block.bullet_list.children instead of block.children
export const prepareNotionBlocksWithShiki = async (
  blocks: Block[],
  options: Omit<Options, "lang">,
) => {
  for (const block of blocks) {
    await prepareNotionBlock(block, options);
    if (block.has_children) {
      await prepareNotionBlocksWithShiki(
        (block as any)[block.type]?.children ?? [],
        options,
      );
    }
  }
};
