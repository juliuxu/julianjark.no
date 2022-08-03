import Highlight, { Prism } from "prism-react-renderer";
import vsDark from "prism-react-renderer/themes/vsDark";
import prismTomorrow from "prismjs/themes/prism-tomorrow.css";

import type { Components as NotionRenderComponents } from "~/packages/notion-render/components";
import { getPlainTextFromRichTextList } from "~/packages/notion-render/components";

export const prismStyles = prismTomorrow;

const themes = { vsDark } as const;
type Theme = keyof typeof themes | undefined;

interface PrismCodeProps {
  code: string;
  language: string;
  theme?: Theme;
}
function PrismCode({ code, language, theme = "vsDark" }: PrismCodeProps) {
  return (
    <Highlight
      Prism={Prism}
      theme={theme ? themes[theme] : undefined}
      code={code}
      language={language as any}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={{ ...style, padding: "1rem" }}>
          {tokens.map((line, i) => (
            <div {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
interface Props {
  code: string;
  language: string;
}
export default function Code(props: Props) {
  return <PrismCode {...props} />;
}

type CollapsedCodeProps = PrismCodeProps & {
  open?: boolean;
  title?: React.ReactNode;
};
export const CollapsedPrismCode = (props: CollapsedCodeProps) => (
  <details open={props.open}>
    <summary>{props.title ?? "Show code"}</summary>
    <Code {...props} />
  </details>
);

export const PrismNotionCode: NotionRenderComponents["code"] = ({ block }) => {
  if (block.type !== "code") return null;
  return (
    <PrismCode
      language={block.code.language}
      code={getPlainTextFromRichTextList(block.code.rich_text)}
    />
  );
};
