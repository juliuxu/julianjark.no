export function assertItemFound<T>(item: T | undefined): asserts item is T {
  if (item === undefined)
    throw new Response("Not Found", {
      status: 404,
    });
}

// See api/image.ts
export const optimizedImageUrl = (
  url: string,
  options?: {
    quality?: number | string;
    width?: number | string;
    height?: number | string;
  }
) => {
  const imageOptimizeUrl = `/api/image`;
  const optionsParams = new URLSearchParams(
    options as Record<string, string>
  ).toString();
  return `${imageOptimizeUrl}?src=${btoa(url)}&${optionsParams}`;
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
