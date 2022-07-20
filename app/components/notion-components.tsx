import { optimizedImageUrl, rewriteNotionImageUrl } from "~/utils";
import type { Components as NotionRenderComponents } from "~/packages/notion-render/components";
import { useNotionRenderContext } from "~/packages/notion-render/context";
import { getTextFromRichText } from "~/notion/notion";

export const OptimizedNotionImage: NotionRenderComponents["image"] = ({
  block,
}) => {
  if (block.type !== "image") return null;
  let url: string;
  if (block.image.type === "external") {
    url = block.image.external.url;
  } else if (block.image.type === "file") {
    url = block.image.file.url;
  } else {
    console.error("unknown image type");
    return null;
  }

  const params = Object.fromEntries(
    new URLSearchParams(getTextFromRichText(block.image.caption))
  );
  const { unoptimized, width, height, alt, lazy } = params as Partial<
    typeof params
  >;

  if (unoptimized !== "true")
    url = optimizedImageUrl(rewriteNotionImageUrl(url, block.id), {
      width,
      height,
    });

  return (
    <img
      className={useNotionRenderContext().classes.image.root}
      src={url}
      loading={lazy !== "false" ? "lazy" : "eager"}
      alt={alt}
    />
  );
};
