import { getTextFromRichText } from "~/notion/notion";
import type { Components as NotionRenderComponents } from "~/packages/notion-render/components";
import { useNotionRenderContext as ctx } from "~/packages/notion-render/context";
import type { ProccessingOptions } from "~/routes/api/image";
import {
  optimizedImageUrl,
  parseImageProccessingOptions,
  rewriteNotionImageUrl,
} from "~/utils";

type ImageParams = {
  unoptimized?: "true" | "false";
  loading?: "eager" | "lazy";
  caption?: string;
  alt?: string;
};
export type OptimizedNotionImageParams = ImageParams & ProccessingOptions;

export const buildOptimizedNotionImage = (
  defaultParams: OptimizedNotionImageParams = {},
) => {
  const OptimizedNotionImage: NotionRenderComponents["image"] = ({ block }) => {
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
    const { unoptimized, loading, caption, alt, ...rest } = {
      ...defaultParams,
      ...params,
    } as Partial<ImageParams & typeof params>;

    // Safari does not support avif yet
    let isAvif = false;
    let nonAvifUrl: string | undefined;
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

    let imgTag = (
      <img
        className={classes.image.root}
        src={nonAvifUrl ?? url}
        loading={loading}
        alt={alt}
      />
    );

    if (isAvif) {
      imgTag = (
        <picture>
          <source srcSet={url} type="image/avif" />
          {imgTag}
        </picture>
      );
    }

    if (caption) {
      imgTag = (
        <figure>
          {imgTag}
          <figcaption>{caption}</figcaption>
        </figure>
      );
    }

    return imgTag;
  };
  return OptimizedNotionImage;
};
