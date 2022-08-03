// https://gist.github.com/jacob-ebey/3a37a86307de9ef22f47aae2e593b56f
// https://github.com/vercel/next.js/blob/canary/packages/next/server/image-optimizer.ts
import sharp from "sharp";
import type { FitEnum } from "sharp";
import type { LoaderArgs } from "@remix-run/node";
import { Response } from "@remix-run/node";
import {
  getBooleanOrUndefined,
  getNumberOrUndefined,
  getOneOfOrUndefined,
} from "~/utils";
import { join as pathJoin } from "path";
import memoizeFs from "memoize-fs";

const badImageBase64 =
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
function badImageResponse() {
  let buffer = Buffer.from(badImageBase64, "base64");
  return new Response(buffer, {
    status: 500,
    headers: {
      "Cache-Control": "max-age=0",
      "Content-Type": "image/gif;base64",
      "Content-Length": buffer.length.toFixed(0),
    },
  });
}

const SUPPORTED_OUTPUT_FORMATS = ["avif", "webp", "png", "jpeg"] as const;
const imageFormatToContentType = (s?: string) => (s ? `image/${s}` : undefined);

export interface ProccessingOptions {
  fit?: keyof FitEnum;
  width?: number;
  height?: number;
  quality?: number;
  blur?: number;
  format?: typeof SUPPORTED_OUTPUT_FORMATS[number];

  // Advanced options
  jpegProgressive?: boolean;
  jpegMozjpeg?: boolean;

  webpEffort?: 1 | 2 | 3 | 4 | 5 | 6;
}
export let fetchAndProccessImage = async (
  href: string,
  options: ProccessingOptions
) => {
  // Fetch image
  const upstreamRes = await fetch(href);
  if (!upstreamRes.ok) {
    throw new Error(
      `upstream image response failed for ${href} ${upstreamRes.status}`
    );
  }

  // Parse image
  const upstreamContentType = upstreamRes.headers.get("Content-Type");
  const upstreamBuffer = Buffer.from(await upstreamRes.arrayBuffer());
  if (!upstreamContentType?.startsWith("image/")) {
    throw new Error(
      `The requested resource isn't a valid image for ${href} received ${upstreamContentType}`
    );
  }

  const AVIF = "image/avif";
  const WEBP = "image/webp";
  const PNG = "image/png";
  const JPEG = "image/jpeg";
  const GIF = "image/gif";
  const SVG = "image/svg+xml";

  // Begin sharp transformation logic
  const transformer = sharp(upstreamBuffer);
  transformer.rotate();

  // Resize if requested
  const { width: actualWidth, height: actualHeight } =
    await transformer.metadata();
  if (
    options.width &&
    options.height &&
    actualWidth &&
    actualHeight &&
    actualWidth > options.width &&
    actualHeight > options.height
  ) {
    transformer.resize({
      width: options.width,
      height: options.height,
      fit: options.fit,
    });
  } else if (options.width && actualWidth && actualWidth > options.width) {
    transformer.resize(options.width);
  } else if (options.height && actualHeight && actualHeight > options.height) {
    transformer.resize(undefined, options.height);
  }

  // Blur if requested
  if (options.blur) {
    transformer.blur(options.blur);
  }

  // Always optimize
  const quality = options.quality ?? 75;
  const outputContentType =
    imageFormatToContentType(options.format) ?? upstreamContentType;
  if (outputContentType === WEBP) {
    transformer.webp({ quality, effort: options.webpEffort });
  } else if (outputContentType === AVIF) {
    transformer.avif({ quality });
  } else if (outputContentType === JPEG) {
    transformer.jpeg({
      quality,
      mozjpeg: options.jpegMozjpeg ?? true,
      progressive: options.jpegProgressive,
    });
  } else if (outputContentType === PNG) {
    transformer.png({ quality });
  }

  const buffer = await transformer.toBuffer();
  return { buffer, contentType: outputContentType };
};

if (process.env.NODE_ENV === "development") {
  const cachePath = pathJoin(".cache", "notion-image-cache");
  console.log("caching images to", cachePath);
  const memoizer = memoizeFs({
    cachePath,
  });
  const memoAsync = (
    fn: memoizeFs.FnToMemoize,
    opts: memoizeFs.Options = {}
  ) => {
    const p = memoizer.fn(fn, opts);
    let mfn: memoizeFs.FnToMemoize | undefined = undefined;
    return async (...args: any) => {
      if (!mfn) {
        mfn = await p;
      }
      return await mfn(...args);
    };
  };

  // fetchAndProccessImage = memoAsync(fetchAndProccessImage);
}

export const loader = async ({ request }: LoaderArgs) => {
  // Parse request
  const url = new URL(request.url);
  const href = url.searchParams.get("src");
  if (!href) {
    return badImageResponse();
  }

  const options: ProccessingOptions = {
    fit: getOneOfOrUndefined(
      ["fill", "contain", "cover", "inside", "outside"],
      url.searchParams.get("fit")
    ),
    width: getNumberOrUndefined(url.searchParams.get("width")),
    height: getNumberOrUndefined(url.searchParams.get("height")),
    quality: getNumberOrUndefined(url.searchParams.get("quality")),
    blur: getNumberOrUndefined(url.searchParams.get("blur")),
    format: getOneOfOrUndefined(
      SUPPORTED_OUTPUT_FORMATS,
      url.searchParams.get("format")
    ),

    jpegProgressive: getBooleanOrUndefined(
      url.searchParams.get("jpegProgressive")
    ),
    jpegMozjpeg: getBooleanOrUndefined(url.searchParams.get("jpegMozjpeg")),
  };

  try {
    const { buffer, contentType } = await fetchAndProccessImage(href, options);

    // Return the new image
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error(error);
    return badImageResponse();
  }
};
