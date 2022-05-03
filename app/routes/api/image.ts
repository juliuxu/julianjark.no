// https://gist.github.com/jacob-ebey/3a37a86307de9ef22f47aae2e593b56f
// https://github.com/vercel/next.js/blob/canary/packages/next/server/image-optimizer.ts
import sharp from "sharp";
import type { LoaderFunction, Request as NodeRequest } from "@remix-run/node";
import { Response } from "@remix-run/node";
import { getNumberOrUndefined } from "~/common";

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

export const loader: LoaderFunction = async ({ request }) => {
  try {
    // Parse request
    const url = new URL(request.url);
    let href = url.searchParams.get("src");
    if (!href) {
      return badImageResponse();
    }
    href = decodeURIComponent(href);

    const options = {
      width: getNumberOrUndefined(url.searchParams.get("width")),
      height: getNumberOrUndefined(url.searchParams.get("height")),
      quality: getNumberOrUndefined(url.searchParams.get("quality")) ?? 75,
      blur: getNumberOrUndefined(url.searchParams.get("blur")),
    };

    // Fetch image
    const upstreamRes = await fetch(href);
    if (!upstreamRes.ok) {
      console.error(
        "upstream image response failed for",
        href,
        upstreamRes.status
      );
      return badImageResponse();
    }
    const upstreamType = upstreamRes.headers.get("Content-Type");
    const upstreamBuffer = Buffer.from(await upstreamRes.arrayBuffer());
    if (!upstreamType?.startsWith("image/")) {
      console.error(
        "The requested resource isn't a valid image for",
        href,
        "received",
        upstreamType
      );
      return badImageResponse();
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
    } else if (options.width && actualWidth && actualWidth > options.width) {
      transformer.resize(options.width);
    } else if (
      options.height &&
      actualHeight &&
      actualHeight > options.height
    ) {
      transformer.resize(undefined, options.height);
    }

    if (upstreamType === WEBP) {
      transformer.webp({ quality: options.quality });
    } else if (upstreamType === PNG) {
      transformer.png({ quality: options.quality });
    } else if (upstreamType === JPEG) {
      transformer.jpeg({ quality: options.quality, mozjpeg: true });
    }

    // Blur
    if (options.blur) {
      transformer.blur(options.blur);
    }

    const optimizedBuffer = await transformer.toBuffer();

    // Return the new image
    return new Response(optimizedBuffer, {
      headers: {
        "Content-Type": upstreamType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }) as unknown as Response;
  } catch (error) {
    console.error(error);
    return badImageResponse();
  }
};
