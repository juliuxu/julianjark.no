import React, { createContext, useContext } from "react";
import { Block, BlockType } from "~/service/notion.types";
import {
  BulletedListItem,
  NumberedListItem,
  Paragraph,
  H1,
  H2,
  H3,
  Quote,
  Todo,
  Toggle,
  Code,
  Callout,
  Divider,
  ColumnList,
  Column,
  Image,
} from "./components";
import {
  BulletedList,
  ListBlock,
  ListBlockType,
  NumberedList,
} from "./pseudoComponents";

export type ExtendedBlock = Block | ListBlock;
export interface BlockComponentProps {
  block: ExtendedBlock;
}
export const Components: Record<
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
  embed: undefined,
  bookmark: undefined,
  image: Image,
  video: undefined,
  pdf: undefined,
  file: undefined,
  audio: undefined,
  link_preview: undefined,
  unsupported: undefined,
};

const filterUnsupportedBlocks = (
  components: typeof Components,
  blocks: Block[]
) => blocks.filter((block) => components[block.type] !== undefined);

export const renderBlock = (
  components: typeof Components,
  block: ExtendedBlock
) => {
  const Component = components[block.type];
  if (Component === undefined) return undefined;
  return <Component key={block.id} block={block} />;
};

// Handle bulleted_list_item and numbered_list_item
// by grouping them into bulleted_list and numbered_list pseudo blocks
const extendBlocks = (blocks: Block[]): ExtendedBlock[] =>
  blocks.reduce((acc, block, index) => {
    if (block.type === "bulleted_list_item") {
      const previousBlock = acc[acc.length - 1];
      if (previousBlock?.type === "bulleted_list") {
        previousBlock.children.push(block);
      } else {
        const listBlock: ListBlock = {
          id: `${index}`,
          type: "bulleted_list",
          children: [],
        };
        listBlock.children.push(block);
        acc.push(listBlock);
      }
    } else if (block.type === "numbered_list_item") {
      const previousBlock = acc[acc.length - 1];
      if (previousBlock?.type === "numbered_list") {
        previousBlock.children.push(block);
      } else {
        const listBlock: ListBlock = {
          id: `${index}`,
          type: "numbered_list",
          children: [],
        };
        listBlock.children.push(block);
        acc.push(listBlock);
      }
    } else {
      acc.push(block);
    }
    return acc;
  }, [] as ExtendedBlock[]);

// Context
interface NotionRenderContext {
  components: typeof Components;
  classes: {};
}
const NotionRenderContext = createContext<NotionRenderContext | undefined>(
  undefined
);
export const useNotionRenderContext = () => {
  const context = useContext(NotionRenderContext);
  if (context === undefined)
    throw new Error("useNotionRenderContext called without a Provider");
  return context;
};

// Main render
interface Props {
  blocks: Block[];
  classes?: {};
  components?: Partial<typeof Components>;
}
export default function NotionRender({ blocks, classes, components }: Props) {
  const context = useContext(NotionRenderContext);

  const finalClasses = { ...classes };
  const finalComponents = {
    ...Components,
    ...context?.components,
    ...components,
  };

  const supportedBlocks = filterUnsupportedBlocks(finalComponents, blocks);
  const extendedBlocks = extendBlocks(supportedBlocks);
  const renderBlocks = extendedBlocks.map((block) =>
    renderBlock(finalComponents, block)
  );
  if (context === undefined) {
    return (
      <NotionRenderContext.Provider
        value={{ classes: finalClasses, components: finalComponents }}
      >
        {renderBlocks}
      </NotionRenderContext.Provider>
    );
  }
  return <>{renderBlocks}</>;
}
