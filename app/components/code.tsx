import { useEffect } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import styles from "prismjs/themes/prism-tomorrow.css";

export const links = () => [{ rel: "stylesheet", href: styles }];

interface Props {
  code: string;
  language: string;
}
export default function Code({ code, language }: Props) {
  useEffect(() => {
    Prism.highlightAll();
  }, []);
  return (
    <div className="Code">
      <pre>
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
}

type CollapsedCodeProps = Props & {
  open?: boolean;
  title?: React.ReactNode;
};
export const CollapsedCode = (props: CollapsedCodeProps) => (
  <details open={props.open}>
    <summary>{props.title ?? "Show code"}</summary>
    <Code {...props} />
  </details>
);
