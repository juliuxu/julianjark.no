interface Props {
  codeHtml: string;
}
export default function ShikiCode({ codeHtml }: Props) {
  return <div dangerouslySetInnerHTML={{ __html: codeHtml }} />;
}

type CollapsedShikiCode = Props & {
  open?: boolean;
  title?: React.ReactNode;
};
export const CollapsedPrismCode = ({
  open,
  title = "Show code",
  ...rest
}: CollapsedShikiCode) => (
  <details open={open}>
    <summary>{title}</summary>
    <ShikiCode {...rest} />
  </details>
);
