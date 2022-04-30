import type { Block } from "~/service/notion.types";
import { BlockComponentProps, DefaultComponents } from "./components";

// Pseudo blocks
export interface ListBlock {
  id: string;
  type: "bulleted_list" | "numbered_list";
  children: Block[];
}
export type ListBlockType = ListBlock["type"];

// Two pseudo blocks to handle list items
export const BulletedList = ({ block }: BlockComponentProps) => {
  if (block.type !== "bulleted_list") return null;
  return (
    <ul>
      {block.children.map((block) => {
        const Component = DefaultComponents[block.type];
        if (Component === undefined) return undefined;
        return <Component key={block.id} block={block} />;
      })}
    </ul>
  );
};
export const NumberedList = ({ block }: BlockComponentProps) => {
  if (block.type !== "numbered_list") return null;
  return (
    <ol>
      {block.children.map((block) => {
        const Component = DefaultComponents[block.type];
        if (Component === undefined) return undefined;
        return <Component key={block.id} block={block} />;
      })}
    </ol>
  );
};
