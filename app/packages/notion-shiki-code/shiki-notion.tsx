import type { Components as NotionRenderComponents } from "~/packages/notion-render/components";
import { ShikiCode } from ".";

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
