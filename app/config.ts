let baseUrl: string;
if (process.env.NODE_ENV === "development") baseUrl = "http://localhost:3000";
// else if (process.env.BASE_URL !== undefined) baseUrl = process.env.BASE_URL;
else baseUrl = "https://julianjark.no";

const HOUR_IN_SECONDS = 60 * 60;
const MONTH_IN_SECONDS = 60 * 60 * 24 * 30;
const YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
const config = {
  baseUrl,
  forsidePageId: "9e33a0b80f334fffaf25b097f5e3b646",
  drinkerDatabaseId: "2ae3c50cf7284db19648aefbd688e45d",
  presentasjonerDatabaseId: "3017a0bad8744638b380b3a7aed7dd5e",
  notionDrivenPagesDatabaseId: "f61d11c80e4b40e2a4329cde350bb31a",
  todayILearnedDatabaseId: "2114376d77f34c0390d81fa606a43fbb",

  // Dranks
  resurserDatabaseId: "12b68d0b65834a4b8419287f83dcd874",

  cacheControlHeaders: {
    "Cache-Control": `public, max-age=10, s-maxage=${60}, stale-while-revalidate=${YEAR_IN_SECONDS}`,
  },

  // Dynamic cache control headers based on the last updated time
  // The idea is that if the page was recently edited, chances are that it will be edited again soon
  cacheControlHeadersDynamic: (
    lastUpdated: string,
    staleWhileRevalidateInSeconds: number = YEAR_IN_SECONDS,
  ) => {
    const diffInSeconds = Math.abs(
      Math.floor(new Date().getTime() - new Date(lastUpdated).getTime() / 1000),
    );

    const thresholds = [
      // Less than 60 seconds since last edit, cache for 5 seconds. Probably don't need cache then
      [60, 5],
      [60 * 5, 30],
      [60 * 60, 60],
      [60 * 60 * 24, 60 * 5],
      [60 * 60 * 24 * 7, 60 * 30],

      // For the rest, keep cache for 4 hours
      // If this is a problem we can always nuke the cache
      [Infinity, 60 * 60 * 4],
    ] as const;
    const serverCacheMaxAge = thresholds.find(
      ([threshold]) => diffInSeconds < threshold,
    )![1];
    return {
      "Cache-Control": `public, max-age=10, s-maxage=${serverCacheMaxAge}, stale-while-revalidate=${staleWhileRevalidateInSeconds}`,
    };
  },
} as const;

export default config;
