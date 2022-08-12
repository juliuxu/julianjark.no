import { useRef } from "react";

interface Props {
  codeHtml: string;
  className?: string;
}
export default function ShikiCode({ codeHtml, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const onCopy: React.MouseEventHandler<HTMLDivElement> = async (e) => {
    const el = ref.current?.querySelector("pre");
    if (!el) return;
    if (el.dataset.copied) return;
    if (!el.textContent?.trim()) return;

    let n = window.getComputedStyle(el),
      o = el.getBoundingClientRect(),
      d = Number.parseInt(n.left, 10) + e.pageX,
      p = Number.parseInt(n.top, 10) + e.pageY,
      u = o.top + document.documentElement.scrollTop,
      f = o.left + document.documentElement.scrollLeft + o.width;
    if (!(d > f - 36 && p < u + 36)) return;

    await navigator.clipboard.writeText(el.textContent.trim());

    el.dataset.copied = "true";
    await new Promise((r) => setTimeout(r, 1e3));
    delete el.dataset.copied;
  };
  return (
    <div
      onClick={onCopy}
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: codeHtml }}
    />
  );
}

type CollapsedShikiCodeProps = Props & {
  open?: boolean;
  title?: React.ReactNode;
  titleClassName?: string;
};

export const CollapsedShikiCode = ({
  open,
  title = "Show code",
  titleClassName,
  ...rest
}: CollapsedShikiCodeProps) => (
  <details open={open}>
    <summary className={titleClassName}>{title}</summary>
    <ShikiCode {...rest} />
  </details>
);
