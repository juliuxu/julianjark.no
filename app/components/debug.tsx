import { CollapsedCode } from "~/components/code";

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
