import { Image } from "@unpic/react";

import { getTextFromRichText } from "~/notion/notion";
import type { Components as NotionRenderComponents } from "~/packages/notion-render/components";
import { useNotionRenderContext as ctx } from "~/packages/notion-render/context";
import type { ProccessingOptions } from "~/routes/api.image";
import {
  parseImageProccessingOptions,
  rewriteNotionImageUrl,
  unpicTransformer,
} from "~/utils";

type ImageParams = {
  unoptimized?: "true" | "false";
  loading?: "eager" | "lazy";
  priority?: "true" | "false";
  caption?: string;
  alt?: string;
};
export type OptimizedNotionImageParams = ImageParams & ProccessingOptions;

export const OptimizedNotionImage: NotionRenderComponents["image"] = ({
  block,
}) => {
  // Parse block
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

  // Parse image options
  const options = Object.fromEntries(
    new URLSearchParams(getTextFromRichText(block.image.caption)),
  );
  const { unoptimized, priority, loading, caption, alt, ...rest } = {
    ...options,
  } as Partial<ImageParams & typeof options>;
  const proccessingOptions = parseImageProccessingOptions(rest);

  url = rewriteNotionImageUrl(url, block.id);

  let imgTag = (
    <>
      <Image
        layout="fixed"
        transformer={unoptimized === "true" ? () => url : unpicTransformer}
        className={ctx().classes.image.root}
        src={url}
        priority={priority === "true"}
        loading={loading}
        alt={alt}
        width={proccessingOptions.width!}
        height={proccessingOptions.height!}
        background="auto"
      />
    </>
  );

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
