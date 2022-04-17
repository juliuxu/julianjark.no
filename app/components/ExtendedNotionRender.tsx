// Group out special blocks not supported by react-notion-render

import { Render as ReactNotionRender } from "@9gustin/react-notion-render";
import { Block } from "~/service/notion.types";

// Let react-notion-render handle "primitive" list of blocks
const groupIt = (blocks: Block[]) => {
  const result: Block[][] = [];
  let currentGroup: Block[] = [];
  for (const block of blocks) {
    if (block.type === "column_list") {
      if (currentGroup.length > 0) result.push(currentGroup);
      currentGroup = [];

      result.push([block]);
    } else {
      currentGroup.push(block);
    }
  }
  if (currentGroup.length > 0) result.push(currentGroup);

  return result;
};
interface Props {
  blocks: Block[];
}
export default function ExtendedNotionRender(props: Props) {
  const groups = groupIt(props.blocks);

  return (
    <>
      {groups.map((group, groupIndex) => {
        if (group[0].type === "column_list") {
          const columnList = group[0];
          return (
            <div key={groupIndex} className="grid">
              {columnList["column_list"].children?.map((column: any) => {
                return (
                  <div key={column.id}>
                    <ExtendedNotionRender blocks={column.column.children} />
                  </div>
                );
              })}
            </div>
          );
        }

        return <ReactNotionRender key={groupIndex} blocks={group as any} />;
      })}
    </>
  );
}
