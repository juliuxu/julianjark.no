interface Props {
  codeHtml: string;
}
export default function ShikiCode({ codeHtml }: Props) {
  return <div dangerouslySetInnerHTML={{ __html: codeHtml }} />;
}
