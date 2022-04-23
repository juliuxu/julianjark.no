import * as shiki from "shiki";
import type { Block } from "~/service/notion.types";
import { getPlainTextFromRichTextList } from "~/notion-render/components";
import type { Components as NotionRenderComponents } from "~/notion-render/components";
import { ShikiCode } from ".";
import { Options } from "./prepare.server";

export const ShikiNotionCode: NotionRenderComponents["code"] = ({ block }) => {
  if (block.type !== "code") return null;
  const codeHtml = (block.code as any).shikiCodeHtml as string;
  if (typeof codeHtml !== "string") {
    throw new Error(
      "Notion blocks needs to be prepared with `prepareNotionBlocks` functino"
    );
  }
  return <ShikiCode codeHtml={codeHtml} />;
};

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
