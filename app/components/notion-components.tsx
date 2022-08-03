import { getTextFromRichText } from "~/notion/notion";
import type { Components as NotionRenderComponents } from "~/packages/notion-render/components";
import { useNotionRenderContext as ctx } from "~/packages/notion-render/context";
import {
  getNumberOrUndefined,
  optimizedImageUrl,
  rewriteNotionImageUrl,
} from "~/utils";

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

  const classes = ctx().classes;

  const params = Object.fromEntries(
    new URLSearchParams(getTextFromRichText(block.image.caption)),
  );
  const { unoptimized, width, height, alt, lazy } = params as Partial<
    typeof params
  >;

  if (unoptimized !== "true")
    url = optimizedImageUrl(rewriteNotionImageUrl(url, block.id), {
      width: getNumberOrUndefined(width),
      height: getNumberOrUndefined(height),
    });

  return (
    <img
      className={classes.image.root}
      src={url}
      loading={lazy !== "false" ? "lazy" : "eager"}
      alt={alt}
    />
  );
};
