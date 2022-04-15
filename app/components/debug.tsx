import { CollapsedCode } from "~/components/code";

export const DebugToggle = () => {
  const onToggle = () => {
    console.log("NOT IMPLEMENTED YET");
    document.location.reload();
  };
  return (
    <fieldset>
      <label htmlFor="debugMode" className="debugButton">
        🧑‍💻
        <input
          type="checkbox"
          id="debugMode"
          name="debugMode"
          role="switch"
          onChange={onToggle}
        />
      </label>
    </fieldset>
  );
};

// Cookies
// https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie

interface Props {
  pageData: any;
}
export default function Debug(props: Props) {
  return (
    <>
      <CollapsedCode
        language="json"
        code={JSON.stringify(props.pageData, null, 2)}
      />
    </>
  );
}
