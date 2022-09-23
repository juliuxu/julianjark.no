import type { LoaderFunction } from "@remix-run/node";

import type { ExportFormat } from "skia-canvas";
import { Canvas } from "skia-canvas";

import config from "~/config";
import designTokens from "~/styles/design-tokens.json";
import { processImage } from "./image";

// https://www.scriptol.com/html5/canvas/rounded-rectangle.php
const roundRect =
  (context: CanvasRenderingContext2D) =>
  ({
    x,
    y,
    w,
    h,
    radius,
  }: {
    x: number;
    y: number;
    w: number;
    h: number;
    radius: number;
  }) => {
    const r = x + w;
    const b = y + h;
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(r - radius, y);
    context.quadraticCurveTo(r, y, r, y + radius);
    context.lineTo(r, y + h - radius);
    context.quadraticCurveTo(r, b, r - radius, b);
    context.lineTo(x + radius, b);
    context.quadraticCurveTo(x, b, x, b - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.stroke();
  };

const generateSocialImage = async (
  input: SocialImageInput,
  options: CanvasOptions,
) => {
  const width = 1200;
  const height = 630;

  const canvas = new Canvas(width, height);
  const context = canvas.getContext("2d");
  context.textWrap = true;

  // Background
  context.fillStyle = designTokens.colors.dark;
  context.fillRect(0, 0, width, height);

  // Headline
  context.font = "bold 2.5rem Menlo";
  context.textAlign = "left";
  context.fillStyle = "rgb(209 213 219)";
  context.fillText(input.headline, 50, 100);

  // Title
  context.font = "bold 5rem Menlo";
  context.textAlign = "left";
  context.textWrap = true;
  context.fillStyle = "#fff";
  context.fillText(input.title, 50, 225, 1200);

  // Author
  context.font = "2rem Menlo";
  context.textAlign = "right";
  context.textWrap = true;
  context.fillStyle = "#fff";
  context.fillText(input.author, canvas.width - 50, canvas.height - 100);

  // Tags
  if (input.tags.length > 0) {
    const tag = input.tags[0];
    context.font = "2rem Menlo";
    context.textAlign = "left";
    context.textWrap = true;
    context.fillStyle = tag.color;

    const lineWidth = 4;
    const padding = 16;
    const tagX = 50 + padding + lineWidth;
    const tagY = canvas.height - 100;

    context.fillText(tag.title.toUpperCase(), tagX, tagY);

    context.strokeStyle = tag.color;
    context.lineWidth = lineWidth;
    const tagTextMetrics = context.measureText(tag.title);
    const tagHeight =
      tagTextMetrics.actualBoundingBoxAscent -
      tagTextMetrics.actualBoundingBoxDescent;
    roundRect(context as any as CanvasRenderingContext2D)({
      x: tagX - padding,
      y: tagY - tagHeight - padding,
      w: tagTextMetrics.width + padding * 2,
      h: tagHeight + padding * 2,
      radius: 15,
    });
  }

  const buffer = await canvas.toBuffer(options.format);
  return buffer;
};

interface CanvasOptions {
  format: ExportFormat;
}
const formatToMimeType: Record<ExportFormat, string> = {
  png: "image/png",
  jpg: "image/jpg",
  jpeg: "image/jpeg",
  pdf: "image/pdf",
  svg: "image/svg+xml",
};

interface SocialImageInput {
  headline: string;
  title: string;
  tags: { title: string; color: string }[];
  author: string;
}

export const socialImageParamsBuilder = (input: SocialImageInput) => {
  const params = new URLSearchParams();
  params.append("headline", input.headline);
  params.append("title", input.title);
  params.append("author", input.author);
  params.append("tags", encodeURIComponent(JSON.stringify(input.tags)));
  return params;
};
export const socialImageUrlBuilder = (input: SocialImageInput) => {
  const url = new URL("/api/social-image", config.baseUrl);
  url.search = socialImageParamsBuilder(input).toString();
  return url.toString();
};

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const rawInput = Object.fromEntries(url.searchParams);
  rawInput.tags = JSON.parse(decodeURIComponent(rawInput.tags));
  const input = rawInput as any as SocialImageInput;

  const options: CanvasOptions = {
    format: "png",
  };
  const buffer = await generateSocialImage(input, options);

  const { buffer: optimizedBuffer, contentType } = await processImage(
    buffer,
    formatToMimeType[options.format],
    {
      format: "webp",
    },
  );

  return new Response(optimizedBuffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(optimizedBuffer.byteLength),
      "Cache-Control": `public, max-age=${60 * 60}`,
    },
  });
};
