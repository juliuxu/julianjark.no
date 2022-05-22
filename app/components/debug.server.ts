import { prepare } from "~/shiki-code-render";
import { isDebugModeFromCookie } from "./debug";

export const maybePrepareDebugData = async (request: Request, data: any) => {
  if (!isDebugModeFromCookie(request.headers.get("cookie") ?? ""))
    return undefined;
  return await prepare(JSON.stringify(data, null, 2), {
    lang: "json",
    theme: "dark-plus",
  });
};
