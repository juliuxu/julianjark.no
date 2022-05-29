import { useContext } from "react";
import { Block } from "~/service/notion.types";
import { Classes, EmptyClasses } from "./classes";
import { Components, DefaultComponents, ExtendedBlock } from "./components";
import NotionRenderContext from "./context";
import { ListBlock } from "./pseudo-components";

const filterUnsupportedBlocks = (components: Components, blocks: Block[]) =>
  blocks.filter((block) => components[block.type] !== undefined);

export const renderBlock = (components: Components, block: ExtendedBlock) => {
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

// Main render
interface Props {
  blocks: Block[];
  classes?: Partial<Classes>;
  components?: Partial<Components>;
}
export default function NotionRender({ blocks, classes, components }: Props) {
  const context = useContext(NotionRenderContext);

  const finalClasses = { ...EmptyClasses, ...context?.classes, ...classes };
  const finalComponents = {
    ...DefaultComponents,
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
