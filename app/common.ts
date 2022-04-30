export function assertItemFound<T>(item: T | undefined): asserts item is T {
  if (item === undefined)
    throw new Response("Not Found", {
      status: 404,
    });
}

// See api/image.ts
export const optimizedImageUrl = (
  url: string,
  options?: { quality?: number; width?: number; height?: number }
) => {
  const imageOptimizeUrl = `/api/image`;
  const optionsParams = new URLSearchParams(
    options as Record<string, string>
  ).toString();
  return `${imageOptimizeUrl}?src=${btoa(url)}&${optionsParams}`;
};
