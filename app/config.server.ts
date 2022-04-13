let baseUrl: string;
if (process.env.NODE_ENV === "development") baseUrl = "http://localhost:3000";
else if (process.env.BASE_URL !== undefined) baseUrl = process.env.BASE_URL;
else baseUrl = "https://julianjark.no";

const config = {
  baseUrl,
  landingPageId: "86ff219a78b94a7a8654d096d9f3096d",
  presentasjonerDatabaseId: "3017a0bad8744638b380b3a7aed7dd5e",
  notionDrivenPagesDatabaseId: "f61d11c80e4b40e2a4329cde350bb31a",
} as const;

export default config;