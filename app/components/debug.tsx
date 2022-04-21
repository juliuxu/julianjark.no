import { useEffect, useState } from "react";
import { CollapsedPrismCode } from "~/components/prismCode";

// This is really hacky.
// The data is still being transfered to the browser, even when it's hidden
export const isDebugMode = () => {
  if (typeof document !== "undefined") {
    const debugMode = document.cookie
      .split("; ")
      .find((row) => row.startsWith("debugMode="))
      ?.split("=")[1];
    return debugMode === "true";
  }
  return false;
};

// Just set this cookie client side.
// It's not sensitive and thus not signed
// That way we can reload and whatever page the user is on gets the updates
// 🤔 Would this work by using an action to set the cookie?
// Would the page loader and render update accordingly?
const setDebugMode = (value: boolean) => {
  // https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
  document.cookie = `debugMode=${value}`;
};

export const DebugToggle = () => {
  const onToggle: React.MouseEventHandler<HTMLInputElement> = (
    e: React.MouseEvent<HTMLInputElement, MouseEvent>
  ) => {
    setDebugMode((e.target as any).checked);
    document.location.reload();
  };
  const debugMode = useIsDebugMode();
  return (
    <fieldset>
      <label
        htmlFor="debugModeSwitch"
        className="debugButton"
        style={
          debugMode
            ? {
                opacity: 1,
                visibility: "visible",
              }
            : undefined
        }
      >
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
const useIsDebugMode = () => {
  const [debugMode, setDebugModeState] = useState(false);
  useEffect(() => {
    setDebugModeState(isDebugMode());
  }, []);
  return debugMode;
};

export const OnlyDebugMode: React.FC<any> = ({ children }) => {
  if (!useIsDebugMode()) return null;
  return <>{children}</>;
};
interface Props {
  pageData: any;
}
export default function Debug(props: Props) {
  return (
    <OnlyDebugMode>
      <CollapsedPrismCode
        language="json"
        code={JSON.stringify(props.pageData, null, 2)}
      />
    </OnlyDebugMode>
  );
}
