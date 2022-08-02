const dranksRequest = await fetch("https://julianjark.no/api/dranks.json");
const dranks = await dranksRequest.json();
const imagesFull = (dranks.dranks as { illustrationUrl: string }[]).map(
  (x) => x.illustrationUrl
);
const imagesShort = imagesFull.slice(0, 3);

export const optimizedImageUrl = (
  url: string,
  options: {
    quality?: number | string;
    width?: number | string;
    height?: number | string;
    fit?: string;
    blur?: number;
    format?: string;
  } = {}
) => {
  const imageOptimizeUrl = `https://julianjark.no/api/image`;
  const optionsParams = new URLSearchParams(
    Object.entries(options)
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key, String(value)])
  );

  return `${imageOptimizeUrl}?src=${encodeURIComponent(url)}&${optionsParams}`;
};

const fetchImage = async (finalUrl: string) => {
  // const startTime = performance.now();
  const response = await fetch(finalUrl);
  // const endTime = performance.now();
  if (!response.ok) throw new Error("got invalid response");

  const size = (await response.blob()).size;

  return size;
};

const fetchAll = async (
  images: string[],
  formats: string[],
  options: Parameters<typeof optimizedImageUrl>[1]
) => {
  const results = [];
  for (let format of formats) {
    const sizes = await Promise.all(
      images.map(
        async (x) =>
          await fetchImage(optimizedImageUrl(x, { ...options, format }))
      )
    );

    const average = Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length);
    const result = sizes.reduce((acc, x, i) => {
      acc[i] = x;
      return acc;
    }, {} as any);
    result.average = average;

    results.push({ [format]: result });
  }
  const transformedResults = results.reduce((acc, x) => ({ ...acc, ...x }));
  return transformedResults;
};

const formats = ["jpeg", "webp", "avif"];
const images = imagesFull;

console.log("Original sizes");
console.table(await fetchAll(images, formats, {}));

console.log("400px height");
console.table(await fetchAll(images, formats, { height: 400 }));

console.log("100px height");
console.table(await fetchAll(images, formats, { height: 100 }));

console.log("10px height");
console.table(await fetchAll(images, formats, { height: 10 }));
