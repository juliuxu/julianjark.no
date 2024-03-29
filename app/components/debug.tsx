import { useEffect, useState } from "react";

import { CollapsedShikiCode } from "~/packages/notion-shiki-code";

export const isDebugMode = (request: Request) =>
  isDebugModeFromCookie(request.headers.get("cookie") ?? "") ||
  new URL(request.url).searchParams.get("debug") !== null;

export const isDebugModeFromCookie = (cookieString: string) => {
  const debugMode = cookieString
    .split("; ")
    .find((row) => row.startsWith("debugMode="))
    ?.split("=")[1];
  // const debugMode = sessionStorage.getItem("debugMode");
  return debugMode === "true";
};

const setDebugMode = (value: boolean) => {
  // https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
  if (value) document.cookie = `debugMode=true`;
  else document.cookie = "debugMode= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
  // sessionStorage.setItem("debugMode", String(value));
};

const isDebugModeFromDocument = () => {
  if (typeof document !== "undefined") {
    return isDebugModeFromCookie(document.cookie);
  }
  return false;
};

export const DebugToggle = () => {
  const onToggle: React.MouseEventHandler<HTMLInputElement> = (
    e: React.MouseEvent<HTMLInputElement, MouseEvent>,
  ) => {
    setDebugMode((e.target as any).checked);
    document.location.reload();
  };
  const debugMode = useIsDebugMode();
  return (
    <fieldset>
      <label htmlFor="debugModeSwitch">
        🧑‍💻
        <input
          type="checkbox"
          id="debugModeSwitch"
          name="debugModeSwitch"
          role="switch"
          // onChange doesn't always get called
          // pretty strange!
          onClick={onToggle}
          defaultChecked={debugMode}
        />
      </label>
    </fieldset>
  );
};

// A bit hacky
export const useIsDebugMode = () => {
  const [debugMode, setDebugModeState] = useState(false);
  useEffect(() => {
    setDebugModeState(isDebugModeFromDocument());
  }, []);
  return debugMode;
};

export const OnlyDebugMode: React.FC<any> = ({ children }) => {
  if (!useIsDebugMode()) return null;
  return <>{children}</>;
};
interface Props {
  debugData?: string;
}
export default function Debug({ debugData }: Props) {
  if (!debugData) return null;
  return (
    <CollapsedShikiCode
      titleClassName="text-white"
      codeHtml={debugData ?? ""}
    />
  );
}
