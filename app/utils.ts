export function assertItemFound<T>(item: T | undefined): asserts item is T {
  if (item === undefined)
    throw new Response("Not Found", {
      status: 404,
    });
}

// See api/image.ts
export const optimizedImageUrl = (
  url: string,
  options: {
    quality?: number | string;
    width?: number | string;
    height?: number | string;
  } = {}
) => {
  const imageOptimizeUrl = `/api/image`;
  const optionsParams = new URLSearchParams(
    Object.entries(options)
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key, String(value)])
  );

  let cacheKey: string;
  const m = url.match(/secure\.notion-static\.com\/(?<uuid>[\w\-]+)\//);
  if (m?.groups?.uuid) {
    cacheKey = encodeURIComponent(m.groups.uuid + optionsParams);
  } else {
    cacheKey = encodeURIComponent(url + optionsParams);
  }

  return `${imageOptimizeUrl}?src=${encodeURIComponent(
    url
  )}&${optionsParams}&juliancachekey=${cacheKey}`;
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
  list: T[],
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
