import { RichTextItem } from "~/service/notion.types";
import NotionRender, { BlockComponentProps } from ".";

/**
 * Rich Text
 */

export const getPlainTextFromRichTextList = (richText: RichTextItem[]) =>
  richText.map((richTextBlock) => richTextBlock.plain_text).join("");

interface RichTextProps {
  richText: RichTextItem;
}
export const RichText = ({ richText }: RichTextProps) => {
  if (richText.type === "equation") return null;
  if (richText.type === "mention") return null;

  let element: JSX.Element = <>{richText.text.content}</>;
  if (richText.annotations.bold) {
    element = <strong>{richText.text.content}</strong>;
  } else if (richText.annotations.code) {
    element = <code>{richText.text.content}</code>;
  } else if (richText.annotations.italic) {
    element = <em>{richText.text.content}</em>;
  } else if (richText.annotations.strikethrough) {
    element = <s>{richText.text.content}</s>;
  } else if (richText.annotations.underline) {
    element = <u>{richText.text.content}</u>;
  }
  if (richText.href !== null) {
    element = <a href={richText.href}>{element}</a>;
  }
  return element;
};
interface RichTextListProps {
  richTextList: RichTextItem[];
}
export const RichTextList = ({ richTextList }: RichTextListProps) => {
  return (
    <>
      {richTextList.map((richText, index) => (
        <RichText key={index} richText={richText} />
      ))}
    </>
  );
};

/**
 * Actual components
 */

export const H1 = ({ block }: BlockComponentProps) => {
  if (block.type !== "heading_1") return null;
  return (
    <h1>
      <RichTextList richTextList={block.heading_1.rich_text} />
    </h1>
  );
};
export const H2 = ({ block }: BlockComponentProps) => {
  if (block.type !== "heading_2") return null;
  return (
    <h2>
      <RichTextList richTextList={block.heading_2.rich_text} />
    </h2>
  );
};
export const H3 = ({ block }: BlockComponentProps) => {
  if (block.type !== "heading_3") return null;
  return (
    <h3>
      <RichTextList richTextList={block.heading_3.rich_text} />
    </h3>
  );
};
export const Paragraph = ({ block }: BlockComponentProps) => {
  if (block.type !== "paragraph") return null;
  return (
    <p>
      <RichTextList richTextList={block.paragraph.rich_text} />
    </p>
  );
};
export const BulletedListItem = ({ block }: BlockComponentProps) => {
  if (block.type !== "bulleted_list_item") return null;
  return (
    <>
      <li>
        <RichTextList richTextList={block.bulleted_list_item.rich_text} />
      </li>
      <NotionRender blocks={(block.bulleted_list_item as any).children ?? []} />
    </>
  );
};
export const NumberedListItem = ({ block }: BlockComponentProps) => {
  if (block.type !== "numbered_list_item") return null;
  return (
    <>
      <li>
        <RichTextList richTextList={block.numbered_list_item.rich_text} />
      </li>
      <NotionRender blocks={(block.numbered_list_item as any).children ?? []} />
    </>
  );
};
export const Quote = ({ block }: BlockComponentProps) => {
  if (block.type !== "quote") return null;
  return (
    <blockquote>
      <RichTextList richTextList={block.quote.rich_text} />
    </blockquote>
  );
};
export const Todo = ({ block }: BlockComponentProps) => {
  if (block.type !== "to_do") return null;
  return (
    <div>
      <input type="checkbox" checked={block.to_do.checked} readOnly />
      <RichTextList richTextList={block.to_do.rich_text} />
    </div>
  );
};
export const Toggle = ({ block }: BlockComponentProps) => {
  if (block.type !== "toggle") return null;
  return (
    <details>
      <summary>
        <RichTextList richTextList={block.toggle.rich_text} />
      </summary>
      <div>
        <NotionRender blocks={(block.toggle as any).children ?? []} />
      </div>
    </details>
  );
};
export const Code = ({ block }: BlockComponentProps) => {
  if (block.type !== "code") return null;
  return (
    <pre>
      <code className={`language-${block.code.language}`}>
        <RichTextList richTextList={block.code.rich_text} />
      </code>
    </pre>
  );
};
export const Callout = ({ block }: BlockComponentProps) => {
  if (block.type !== "callout") return null;
  return (
    <div>
      <div>
        <RichTextList richTextList={block.callout.rich_text} />
      </div>
    </div>
  );
};
export const Divider = ({ block }: BlockComponentProps) => {
  if (block.type !== "divider") return null;
  return <hr />;
};
export const ColumnList = ({ block }: BlockComponentProps) => {
  if (block.type !== "column_list") return null;
  return (
    <div>
      <NotionRender blocks={block.column_list.children} />
    </div>
  );
};
export const Column = ({ block }: BlockComponentProps) => {
  if (block.type !== "column") return null;
  return (
    <div>
      <NotionRender blocks={block.column.children} />
    </div>
  );
};
export const Image = ({ block }: BlockComponentProps) => {
  if (block.type !== "image") return null;
  let url: string;
  if (block.image.type === "external") {
    url = block.image.external.url;
  } else if (block.image.type === "file") {
    url = block.image.file.url;
  } else {
    console.error("unknown image type");
    return null;
  }

  return (
    <img alt={getPlainTextFromRichTextList(block.image.caption)} src={url} />
  );
};
