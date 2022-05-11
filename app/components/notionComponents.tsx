import { getKeyValueOptions, optimizedImageUrl } from "~/common";
import type { Components as NotionRenderComponents } from "~/packages/notion-render/components";
import { useNotionRenderContext } from "~/packages/notion-render/context";
import { getTextFromRichText } from "~/service/notion";

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

  const { unoptimized, width, height } = getKeyValueOptions<{
    unoptimized?: string;
    width?: string;
    height?: string;
  }>(getTextFromRichText(block.image.caption));

  if (unoptimized !== "true") url = optimizedImageUrl(url, { width, height });

  return (
    <img
      className={useNotionRenderContext().classes.image.root}
      src={url}
      loading="lazy"
    />
  );
};
