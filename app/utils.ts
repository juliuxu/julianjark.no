import type { ProccessingOptions } from "./routes/api/image";

export function assertItemFound<T>(item: T | undefined): asserts item is T {
  if (item === undefined)
    throw new Response("Not Found", {
      status: 404,
    });
}

// Rewrite secure notion image urls
// The downside of this is that the page/block needs to be public
// Ok for my use-case
export const rewriteNotionImageUrl = (url: string, pageOrBlockId: string) => {
  // Determine if it's a notion aws url
  const m = url.match(
    /^(?<awsUrl>https:\/\/.+?secure\.notion-static\.com\/[\w-]+\/.+?)\?/
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
    awsUrl
  )}?${optionsParams}`;

  return newUrl;
};

// See api/image.ts
export const optimizedImageUrl = (
  url: string,
  options: ProccessingOptions = {}
) => {
  const imageOptimizeUrl = `/api/image`;
  const optionsParams = new URLSearchParams(
    Object.entries(options)
      .filter(([key, value]) => key && value !== undefined)
      .map(([key, value]) => [key, String(value)])
  );

  return `${imageOptimizeUrl}?src=${encodeURIComponent(url)}&${optionsParams}`;
};

export function getKeyValueOptions<T extends Record<string, string>>(
  s: string
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
  s?: string | null
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
export function debounce(fn: (...args: any) => unknown, ms: number) {
  let timeout: NodeJS.Timeout;
  return (...args: any) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
}
