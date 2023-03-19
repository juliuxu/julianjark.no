import type { UrlTransformer } from "unpic";

import config from "./config";
import type { ProccessingOptions } from "./routes/api.image";
import type { SocialImageInput } from "./routes/api.social-image";

export function assertItemFound<T>(item: T | undefined): asserts item is T {
  if (item === undefined)
    throw new Response("Not Found", {
      status: 404,
    });
}

export function assertContainsItems<K extends string, V, T extends K>(
  properties: readonly T[],
  record: Record<K, V> | Record<T, V>,
): asserts record is Record<T, V> {
  const s = new Set(properties);
  Object.keys(record).forEach((key) => {
    if (!s.has(key as any)) {
      throw new Error(`${key} is missing`);
    }
  });
}

// Social Image
export const socialImageParamsBuilder = (input: SocialImageInput) => {
  const params = new URLSearchParams(Object.entries(input));
  params.set("tags", encodeURIComponent(JSON.stringify(input.tags)));
  return params;
};
export const socialImageUrlBuilder = (input: SocialImageInput) => {
  const url = new URL("/api/social-image", config.baseUrl);
  url.search = socialImageParamsBuilder(input).toString();
  return url.toString();
};

// Rewrite secure notion image urls
// The downside of this is that the page/block needs to be public
// Ok for my use-case
export const rewriteNotionImageUrl = (url: string, pageOrBlockId: string) => {
  // Determine if it's a notion aws url
  const m = url.match(
    /^(?<awsUrl>https:\/\/.+?secure\.notion-static\.com\/[\w-]+\/.+?)\?/,
  );
  const awsUrl = m?.groups?.awsUrl;
  if (awsUrl === undefined) return url;

  // This is the url notion uses
  const optionsParams = new URLSearchParams({
    table: "block",
    id: pageOrBlockId,
    cache: "v2",
  });
  const newUrl = `https://www.notion.so/image/${encodeURIComponent(
    awsUrl,
  )}?${optionsParams}`;

  return newUrl;
};

// Custom transformer for unpic
// See api/image.ts
export const unpicTransformer: UrlTransformer = ({
  url,
  format = "webp",
  height,
  width,
}) => {
  const parsedUrl = new URL(url);
  const isOptimizedImage = parsedUrl.pathname.startsWith("/api/image");
  const src = isOptimizedImage
    ? parsedUrl.searchParams.get("src")
    : url.toString();

  const result = new URL("/api/image", config.baseUrl);
  result.searchParams.set("src", src!);
  format && result.searchParams.set("format", format);
  height && result.searchParams.set("height", height.toString());
  width && result.searchParams.set("width", width.toString());

  // Blur the image on 24
  if (width === 24) {
    result.searchParams.set("blur", "1");
  }
  return result;
};

export const parseImageProccessingOptions = (
  object: Partial<Record<string, string>>,
): ProccessingOptions => {
  return {
    fit: getOneOfOrUndefined(
      ["fill", "contain", "cover", "inside", "outside"],
      object["fit"],
    ),
    width: getNumberOrUndefined(object["width"]),
    height: getNumberOrUndefined(object["height"]),
    quality: getNumberOrUndefined(object["quality"]),
    blur: getNumberOrUndefined(object["blur"]),
    format: getOneOfOrUndefined(
      ["auto", "avif", "webp", "png", "jpeg"],
      object["format"],
    ),

    original: getBooleanOrUndefined(object["original"]),
    jpegProgressive: getBooleanOrUndefined(object["jpegProgressive"]),
    jpegMozjpeg: getBooleanOrUndefined(object["jpegMozjpeg"]),
    webpEffort: getNumberOrUndefined(
      object["webpEffort"],
    ) as ProccessingOptions["webpEffort"],
  };
};

export function getKeyValueOptions<T extends Record<string, string>>(
  s: string,
): T {
  const options: Record<string, string> = {};
  const optionsList = s.split(" ");
  optionsList.forEach((option) => {
    const l = option.split("=");
    if (l.length === 2) {
      options[l[0]] = l[1];
    }
  });

  return options as T;
}

export const getNonEmptyStringOrUndefined = (s?: string | null) => {
  if (!s) return undefined;
  if (s.length < 1) return undefined;
  return s;
};
export const getNumberOrUndefined = (s?: string | null) => {
  if (!s) return undefined;
  const v = Number.parseInt(s ?? "");
  if (!Number.isInteger(v)) return undefined;
  return v;
};
export const getDateOrUndefined = (s?: string | null) => {
  if (!s) return undefined;
  const v = new Date(s);
  if (v instanceof Date && !isNaN(v as any)) return v;
  return undefined;
};
export const getBooleanOrUndefined = (s?: string | null) => {
  if (s === "true") return true;
  if (s === "false") return false;
  return undefined;
};
export function getOneOfOrUndefined<T extends string>(
  list: readonly T[],
  s?: string | null,
) {
  if (list.includes(s as any)) return s as T;
  return undefined;
}

export function takeWhileM<T>(arr: T[], predicate: (el: T) => boolean) {
  const result: T[] = [];
  while (arr.length > 0 && predicate(arr[0])) {
    result.push(arr.shift()!);
  }
  return result;
}

export function chunked<T>(l: T[], chunkSize: number) {
  const result: T[][] = [];
  const copy = l.slice();
  while (copy.length > 0) {
    result.push(copy.splice(0, chunkSize));
  }

  return result;
}

// TODO: Type this
export function debounce<T extends Function>(fn: T, ms: number) {
  let timeout: NodeJS.Timeout;
  return (...args: any) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}

export function flattenDepthFirst<T extends { children?: T[] }>(root: T) {
  const result: T[] = [];

  const stack: T[] = [];
  let current: T | undefined = root;
  while (current !== undefined) {
    const currentWithoutChildren = { ...current, children: [] };
    result.push(currentWithoutChildren);
    if (current.children) {
      stack.unshift(...current.children);
    }
    current = stack.shift();
  }

  return result;
}

export function flattenListDepthFirst<T extends { children?: T[] }>(list: T[]) {
  return list.flatMap(flattenDepthFirst);
}

export function typedBoolean<T>(
  value: T,
): value is Exclude<T, "" | 0 | false | null | undefined> {
  return Boolean(value);
}

// dateStyle: "long",
export const formatDate = (d: string | Date, language: "no" | "en" = "no") =>
  new Date(d).toLocaleDateString(language, {
    // weekday: "short",
    // year: "numeric",
    // month: "long",
    // day: "2-digit",
    dateStyle: "long",
  });

export const isDevMode = (request?: Request) =>
  request && new URL(request?.url).searchParams.get("dev") !== null;
