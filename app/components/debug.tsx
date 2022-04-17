import { useEffect, useState } from "react";
import { CollapsedCode } from "~/components/code";

// This is really hacky.
// The data is still being transfered to the browser, even when it's hidden
const isDebugMode = () => {
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
  return (
    <fieldset>
      <label htmlFor="debugModeSwitch" className="debugButton">
        🧑‍💻
        <input
          type="checkbox"
          id="debugModeSwitch"
          name="debugModeSwitch"
          role="switch"
          // onChange doesn't always get called
          // pretty strange!
          onClick={onToggle}
          defaultChecked={isDebugMode()}
        />
      </label>
    </fieldset>
  );
};

interface Props {
  pageData: any;
}
export default function Debug(props: Props) {
  // A bit hacky...
  const [debugMode, setDebugModeState] = useState(false);
  useEffect(() => {
    setDebugModeState(isDebugMode());
  }, []);
  if (!debugMode) return null;

  return (
    <>
      <CollapsedCode
        language="json"
        code={JSON.stringify(props.pageData, null, 2)}
      />
    </>
  );
}
