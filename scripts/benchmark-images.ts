import { optimizedImageUrl } from "../app/utils.ts";

const cachePurge = false;
const local = false;

const baseUrl = local ? "http://localhost:3000" : "https://julianjark.no";
const dranksRequest = await fetch(`${baseUrl}/api/dranks.json`);
const dranks = await dranksRequest.json();
const imagesFull = (dranks.dranks as { illustrationUrl: string }[]).map(
  (x) => x.illustrationUrl
);
const imagesShort = imagesFull.slice(0, 3);
const imageSet = imagesFull;

const fetchImageSize = async (finalUrl: string) => {
  const response = await fetch(finalUrl, {
    headers: { "Cache-Purge": cachePurge ? "1" : "0" },
  });
  if (!response.ok) throw new Error(`got invalid response ${response.status}`);

  const serverTimingHeader = response.headers.get("Server-Timing") ?? "";
  const timings = serverTimingHeader
    .split(", ")
    .map((x) => {
      const s = x.split(";dur=");
      return { [s[0]]: Number.parseInt(s[1]) };
    })
    .reduce(
      (acc, x) => ({ ...acc, ...x }),
      {} as Partial<Record<string, number>>
    );

  const size = (await response.arrayBuffer()).byteLength;
  const processTime = timings["process"] ?? NaN;
  return { size, processTime };
};

const fetchForOptions = async (
  images: readonly string[],
  options: Parameters<typeof optimizedImageUrl>[1]
) => {
  const results = await Promise.all(
    images.map((url) =>
      fetchImageSize(baseUrl + optimizedImageUrl(url, options))
    )
  );
  const sizes = results.map((x) => x.size);
  const processTimes = results.map((x) => x.processTime);

  const averageSize = Math.round(
    sizes.reduce((a, b) => a + b, 0) / sizes.length
  );
  const averageProcessTime = Math.round(
    processTimes.reduce((a, b) => a + b, 0) / processTimes.length
  );
  const result = sizes.reduce((acc, x, i) => {
    acc[i] = x;
    return acc;
  }, {} as { [key: number | string]: number });
  result.average = averageSize;
  result["avg process"] = averageProcessTime;
  result["min process"] = Math.min(...processTimes);
  result["max process"] = Math.max(...processTimes);

  return result;
};

const tests: [
  string,
  [string, NonNullable<Parameters<typeof optimizedImageUrl>[1]>][]
][] = [
  [
    "Full size",
    [
      ["original", { original: true }],
      ["webp", { format: "webp" }],
      ["webp effort 1", { format: "webp", webpEffort: 1 }],
      ["webp effort 6", { format: "webp", webpEffort: 6 }],
      ["jpeg not mozjpeg", { format: "jpeg", jpegMozjpeg: false }],
      [
        "jpeg progressive",
        { format: "jpeg", jpegMozjpeg: false, jpegProgressive: true },
      ],
      ["jpeg mozjpeg", { format: "jpeg", jpegMozjpeg: true }],
      [
        "jpeg mozjpeg progressive",
        { format: "jpeg", jpegMozjpeg: true, jpegProgressive: true },
      ],
      ["avif", { format: "avif" }],
    ],
  ],

  [
    "400px height",
    [
      ["webp", { format: "webp", height: 400 }],
      ["jpeg", { format: "jpeg", height: 400 }],
      ["avif", { format: "avif", height: 400 }],
    ],
  ],

  [
    "100px height",
    [
      ["webp", { format: "webp", height: 100 }],
      ["jpeg", { format: "jpeg", height: 100 }],
      ["avif", { format: "avif", height: 100 }],
    ],
  ],

  [
    "100px height blur 15",
    [
      ["webp", { format: "webp", height: 100, blur: 15 }],
      ["jpeg", { format: "jpeg", height: 100, blur: 15 }],
      ["avif", { format: "avif", height: 100, blur: 15 }],
    ],
  ],

  [
    "10px height",
    [
      ["webp", { format: "webp", height: 10 }],
      ["jpeg", { format: "jpeg", height: 10 }],
      ["avif", { format: "avif", height: 10 }],
    ],
  ],
];

for (const [testName, optionsList] of tests) {
  const results: Record<
    string,
    Awaited<ReturnType<typeof fetchForOptions>>
  > = {};
  console.log(testName);
  for (const [name, options] of optionsList) {
    // console.log("fetching for", name);
    results[name] = await fetchForOptions(imageSet, options);
  }
  console.table(results);
}
