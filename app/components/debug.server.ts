import { prepare } from "~/packages/notion-shiki-code";
import { isDebugMode } from "./debug";

export const maybePrepareDebugData = async (request: Request, data: any) => {
  if (!isDebugMode(request)) return undefined;
  return await prepare(JSON.stringify(data, null, 2), {
    lang: "json",
    theme: "dark-plus",
  });
};
