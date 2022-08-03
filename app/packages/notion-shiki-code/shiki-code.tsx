interface Props {
  codeHtml: string;
  className?: string;
}
export default function ShikiCode({ codeHtml, className }: Props) {
  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: codeHtml }} />
  );
}

type CollapsedShikiCodeProps = Props & {
  open?: boolean;
  title?: React.ReactNode;
};

export const CollapsedShikiCode = ({
  open,
  title = "Show code",
  ...rest
}: CollapsedShikiCodeProps) => (
  <details open={open}>
    <summary>{title}</summary>
    <ShikiCode {...rest} />
  </details>
);
