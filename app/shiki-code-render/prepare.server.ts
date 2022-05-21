import * as shiki from "shiki";
import type { Lang, Theme } from "shiki";
import { getPlainTextFromRichTextList } from "~/packages/notion-render/components";
import { Block } from "~/service/notion.types";

interface LineOption {
  line: number;
  classes?: string[];
}
export interface Options {
  lang: Lang;
  theme?: Theme;
  lineOptions?: LineOption[];
}

const parseCaption = (caption: string): { language?: string } => {
  const keys = ["language"] as const;
  const optionsList = caption.split(" ");
  const options: ReturnType<typeof parseCaption> = {};
  optionsList.forEach((option) => {
    const s = option.split("=");
    if (s.length !== 2) return;
    if (keys.includes(s[0] as typeof keys[number])) {
      options[s[0] as typeof keys[number]] = s[1];
    }
  });
  return options;
};

export default async function prepare(codeText: string, options: Options) {
  const highlighter = await shiki.getHighlighter({ theme: options.theme });
  return highlighter.codeToHtml(codeText, options);
}

// Mutates the given list
// TODO: Update psuedo ListBlock block.bullet_list.children instead of block.children
export const prepareNotionBlocks = async (
  blocks: Block[],
  options: Omit<Options, "lang">
) => {
  const highlighter = await shiki.getHighlighter({ theme: options.theme });

  const innerF = (innerBlocks: Block[]) =>
    innerBlocks.forEach((block) => {
      if (block.type === "code") {
        const captionInfo = parseCaption(
          getPlainTextFromRichTextList(block.code.caption)
        );
        (block.code as any).shikiCodeHtml = highlighter.codeToHtml(
          getPlainTextFromRichTextList(block.code.rich_text),
          { lang: captionInfo.language ?? block.code.language }
        );
      }
      if (block.has_children) {
        innerF((block as any)[block.type]?.children ?? []);
      }
    });
  innerF(blocks);
};
