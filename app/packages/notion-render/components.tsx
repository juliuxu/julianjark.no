import { Block, BlockType, RichTextItem } from "~/service/notion.types";
import NotionRender from ".";
import { useNotionRenderContext as ctx } from "./context";
import {
  ListBlock,
  ListBlockType,
  BulletedList,
  NumberedList,
} from "./pseudo-components";

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

  const classes = ctx().classes;

  let element: JSX.Element;
  element = (
    <span className={classes[`color_${richText.annotations.color}`]}>
      {richText.plain_text}
    </span>
  );

  if (richText.annotations.bold) {
    element = (
      <strong className={classes.annotation_bold}>{richText.plain_text}</strong>
    );
  } else if (richText.annotations.code) {
    element = (
      <code className={classes.annotation_code}>{richText.plain_text}</code>
    );
  } else if (richText.annotations.italic) {
    element = (
      <em className={classes.annotation_italic}>{richText.plain_text}</em>
    );
  } else if (richText.annotations.strikethrough) {
    element = (
      <s className={classes.annotation_strikethrough}>{richText.plain_text}</s>
    );
  } else if (richText.annotations.underline) {
    element = (
      <u className={classes.annotation_underline}>{richText.plain_text}</u>
    );
  }

  // TODO: Link style
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
  const element = (
    <h1
      className={`${ctx().classes[`color_${block.heading_1.color}`]} ${
        ctx().classes.heading_1.root
      }`}
    >
      <RichTextList richTextList={block.heading_1.rich_text} />
    </h1>
  );
  if (block.has_children) {
    return (
      <ToggleInner heading={element}>
        <NotionRender blocks={(block.heading_1 as any).children ?? []} />
      </ToggleInner>
    );
  }
  return element;
};
export const H2 = ({ block }: BlockComponentProps) => {
  if (block.type !== "heading_2") return null;
  const element = (
    <h2
      className={`${ctx().classes[`color_${block.heading_2.color}`]} ${
        ctx().classes.heading_1.root
      }`}
    >
      <RichTextList richTextList={block.heading_2.rich_text} />
    </h2>
  );
  if (block.has_children) {
    return (
      <ToggleInner heading={element}>
        <NotionRender blocks={(block.heading_2 as any).children ?? []} />
      </ToggleInner>
    );
  }
  return element;
};
export const H3 = ({ block }: BlockComponentProps) => {
  if (block.type !== "heading_3") return null;
  const element = (
    <h3
      className={`${ctx().classes[`color_${block.heading_3.color}`]} ${
        ctx().classes.heading_1.root
      }`}
    >
      <RichTextList richTextList={block.heading_3.rich_text} />
    </h3>
  );
  if (block.has_children) {
    return (
      <ToggleInner heading={element}>
        <NotionRender blocks={(block.heading_3 as any).children ?? []} />
      </ToggleInner>
    );
  }
  return element;
};
export const Paragraph = ({ block }: BlockComponentProps) => {
  if (block.type !== "paragraph") return null;
  return (
    <p className={ctx().classes.paragraph.root}>
      <RichTextList richTextList={block.paragraph.rich_text} />
    </p>
  );
};
export const BulletedListItem = ({ block }: BlockComponentProps) => {
  if (block.type !== "bulleted_list_item") return null;
  return (
    <>
      <li className={ctx().classes.bulleted_list_item.root}>
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
      <li className={ctx().classes.numbered_list_item.root}>
        <RichTextList richTextList={block.numbered_list_item.rich_text} />
      </li>
      <NotionRender blocks={(block.numbered_list_item as any).children ?? []} />
    </>
  );
};
export const Quote = ({ block }: BlockComponentProps) => {
  if (block.type !== "quote") return null;
  return (
    <blockquote className={ctx().classes.quote.root}>
      <RichTextList richTextList={block.quote.rich_text} />
    </blockquote>
  );
};
export const Todo = ({ block }: BlockComponentProps) => {
  if (block.type !== "to_do") return null;
  return (
    <div className={ctx().classes.to_do.root}>
      <input type="checkbox" checked={block.to_do.checked} readOnly />
      <RichTextList richTextList={block.to_do.rich_text} />
    </div>
  );
};

const ToggleInner = ({
  heading,
  children,
}: {
  heading: JSX.Element;
  children: React.ReactNode;
}) => (
  <details className={ctx().classes.toggle.root}>
    <summary>{heading}</summary>
    <div>{children}</div>
  </details>
);
export const Toggle = ({ block }: BlockComponentProps) => {
  if (block.type !== "toggle") return null;
  return (
    <ToggleInner
      heading={<RichTextList richTextList={block.toggle.rich_text} />}
    >
      <NotionRender blocks={(block.toggle as any).children ?? []} />
    </ToggleInner>
  );
};
export const Code = ({ block }: BlockComponentProps) => {
  if (block.type !== "code") return null;
  return (
    <pre className={ctx().classes.code.root}>
      <code className={`language-${block.code.language}`}>
        <RichTextList richTextList={block.code.rich_text} />
      </code>
    </pre>
  );
};
export const Callout = ({ block }: BlockComponentProps) => {
  if (block.type !== "callout") return null;
  return (
    <div className={ctx().classes.callout.root}>
      <div>
        <RichTextList richTextList={block.callout.rich_text} />
      </div>
    </div>
  );
};
export const Divider = ({ block }: BlockComponentProps) => {
  if (block.type !== "divider") return null;
  return <hr className={ctx().classes.divider.root} />;
};
export const ColumnList = ({ block }: BlockComponentProps) => {
  if (block.type !== "column_list") return null;
  return (
    <div className={ctx().classes.column_list.root}>
      <NotionRender blocks={block.column_list.children} />
    </div>
  );
};
export const Column = ({ block }: BlockComponentProps) => {
  if (block.type !== "column") return null;
  return (
    <div className={ctx().classes.column.root}>
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
    <img
      className={ctx().classes.image.root}
      alt={getPlainTextFromRichTextList(block.image.caption)}
      src={url}
    />
  );
};
export const Embed = ({ block }: BlockComponentProps) => {
  if (block.type !== "embed") return null;
  return (
    <iframe
      className={ctx().classes.embed.root}
      src={block.embed.url}
      title={getPlainTextFromRichTextList(block.embed.caption)}
      style={{ border: 0 }}
    ></iframe>
  );
};
export const Video = ({ block }: BlockComponentProps) => {
  if (block.type !== "video") return null;
  if (block.video.type !== "external") return null;

  const urlObject = new URL(block.video.external.url);

  // Youtube
  const youtubeDomains = [
    "youtu.be",
    "youtube.com",
    "youtube-nocookie.com",
    "www.youtu.be",
    "www.youtube.com",
    "www.youtube-nocookie.com",
  ];

  // https://gist.github.com/takien/4077195
  function YouTubeGetID(url: string) {
    const urlSplit = url.split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
    return urlSplit[2] !== undefined
      ? urlSplit[2].split(/[^0-9a-z_\-]/i)[0]
      : urlSplit[0];
  }

  if (youtubeDomains.includes(urlObject.hostname)) {
    return (
      <iframe
        className={ctx().classes.embed.root}
        src={`https://www.youtube-nocookie.com/embed/${YouTubeGetID(
          block.video.external.url
        )}`}
        title={getPlainTextFromRichTextList(block.video.caption)}
        width="560"
        height="315"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{ border: 0 }}
      />
    );
  }

  // Generic video
  return (
    <iframe
      className={ctx().classes.embed.root}
      src={block.video.external.url}
      title={getPlainTextFromRichTextList(block.video.caption)}
    />
  );
};

export type ExtendedBlock = Block | ListBlock;
export interface BlockComponentProps {
  block: ExtendedBlock;
}
export const DefaultComponents: Record<
  BlockType | ListBlockType,
  React.ComponentType<BlockComponentProps> | undefined
> = {
  // These pseudo blocks are not part of the notion api
  // but added here to make handling easier
  bulleted_list: BulletedList,
  numbered_list: NumberedList,

  bulleted_list_item: BulletedListItem,
  numbered_list_item: NumberedListItem,
  paragraph: Paragraph,
  heading_1: H1,
  heading_2: H2,
  heading_3: H3,
  quote: Quote,
  to_do: Todo,
  toggle: Toggle,
  template: undefined,
  synced_block: undefined,
  child_page: undefined,
  child_database: undefined,
  equation: undefined,
  code: Code,
  callout: Callout,
  divider: Divider,
  breadcrumb: undefined,
  table_of_contents: undefined,
  column_list: ColumnList,
  column: Column,
  link_to_page: undefined,
  table: undefined,
  table_row: undefined,
  embed: Embed,
  bookmark: undefined,
  image: Image,
  video: Video,
  pdf: undefined,
  file: undefined,
  audio: undefined,
  link_preview: undefined,
  unsupported: undefined,
};
export type Components = typeof DefaultComponents;
