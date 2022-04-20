import Highlight, { Prism } from "prism-react-renderer";
import vsDark from "prism-react-renderer/themes/vsDark";

const themes = { vsDark } as const;
type Theme = keyof typeof themes | undefined;

interface Props {
  code: string;
  language: string;
  theme?: Theme;
}
export default function Code({ code, language, theme }: Props) {
  return (
    <Highlight
      Prism={Prism}
      theme={theme ? themes[theme] : undefined}
      code={code}
      language={language as any}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} style={style}>
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
