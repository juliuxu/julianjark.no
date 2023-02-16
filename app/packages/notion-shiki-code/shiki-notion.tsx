import { getTextFromRichText } from "~/notion/notion";
import type { Components as NotionRenderComponents } from "~/packages/notion-render/components";
import { useNotionRenderContext as ctx } from "~/packages/notion-render/context";
import { ShikiCode } from ".";

export const ShikiNotionCode: NotionRenderComponents["code"] = ({ block }) => {
  if (block.type !== "code") return null;
  const codeHtml = (block.code as any).codeHtml as string;
  if (typeof codeHtml !== "string") {
    throw new Error(
      "Notion blocks needs to be prepared with `prepareNotionBlocks` function",
    );
  }
  const classes = ctx().classes;

  const caption = Object.fromEntries(
    new URLSearchParams(getTextFromRichText(block.code.caption) ?? ""),
  );

  let codeTag = <ShikiCode className={classes.code.root} codeHtml={codeHtml} />;

  if (caption.caption) {
    codeTag = (
      <figure>
        {codeTag}
        <figcaption>{caption.caption}</figcaption>
      </figure>
    );
  }

  return codeTag;
};
