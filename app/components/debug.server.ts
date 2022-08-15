import { prepare } from "~/packages/notion-shiki-code";
import { isDebugModeFromCookie } from "./debug";

export const maybePrepareDebugData = async (request: Request, data: any) => {
  if (
    !isDebugModeFromCookie(request.headers.get("cookie") ?? "") &&
    new URL(request.url).searchParams.get("debug") === null
  )
    return undefined;
  return await prepare(JSON.stringify(data, null, 2), {
    lang: "json",
    theme: "dark-plus",
  });
};
