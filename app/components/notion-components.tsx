import { getTextFromRichText } from "~/notion/notion";
import type { Components as NotionRenderComponents } from "~/packages/notion-render/components";
import { useNotionRenderContext as ctx } from "~/packages/notion-render/context";
import {
  optimizedImageUrl,
  parseImageProccessingOptions,
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
  const { unoptimized, alt, lazy, ...rest } = params as Partial<typeof params>;

  // Safari does not support avif yet
  let isAvif = false;
  let nonAvifUrl = "";
  if (unoptimized !== "true") {
    const options = parseImageProccessingOptions(rest);
    if (options.format === "avif") {
      isAvif = true;
      nonAvifUrl = optimizedImageUrl(rewriteNotionImageUrl(url, block.id), {
        ...options,
        format: undefined,
        quality: undefined,
      });
    }

    url = optimizedImageUrl(rewriteNotionImageUrl(url, block.id), options);
  }

  const imgTag = (
    <img
      className={classes.image.root}
      src={url}
      loading={lazy !== "false" ? "lazy" : "eager"}
      alt={alt}
    />
  );

  if (isAvif) {
    return (
      <picture>
        <source srcSet={url} type="image/avif" />
        <img
          className={classes.image.root}
          src={nonAvifUrl}
          loading={lazy !== "false" ? "lazy" : "eager"}
          alt={alt}
        />
      </picture>
    );
  }

  return imgTag;
};
