// https://gist.github.com/jacob-ebey/3a37a86307de9ef22f47aae2e593b56f
// https://github.com/vercel/next.js/blob/canary/packages/next/server/image-optimizer.ts
import sharp from "sharp";
import type { LoaderFunction, Request as NodeRequest } from "@remix-run/node";
import { Response } from "@remix-run/node";

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

function getIntOrNull(value: string | null) {
  if (value === null) {
    return null;
  }

  return Number.parseInt(value);
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

    const width = getIntOrNull(url.searchParams.get("width"));
    const height = getIntOrNull(url.searchParams.get("height"));
    const quality = getIntOrNull(url.searchParams.get("quality")) ?? 75;
    const blur = getIntOrNull(url.searchParams.get("blur"));

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
    const { width: metaWidth, height: metaHeight } =
      await transformer.metadata();
    if (
      width &&
      height &&
      metaWidth &&
      metaHeight &&
      metaWidth > width &&
      metaHeight > height
    ) {
    } else if (width && metaWidth && metaWidth > width) {
      transformer.resize(width);
    } else if (height && metaHeight && metaHeight > height) {
      transformer.resize(undefined, height);
    }

    if (upstreamType === WEBP) {
      transformer.webp({ quality });
    } else if (upstreamType === PNG) {
      transformer.png({ quality });
    } else if (upstreamType === JPEG) {
      transformer.jpeg({ quality, mozjpeg: true });
    }

    // Blur
    if (blur) {
      transformer.blur(blur);
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
