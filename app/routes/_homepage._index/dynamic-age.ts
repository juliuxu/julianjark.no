import type { Block } from "~/notion/notion.types";

export const getAgeFromBirthDate = (birthDate: Date) => {
  const now = new Date();

  const d1 = birthDate.getDate();
  const m1 = 1 + birthDate.getMonth();
  const y1 = birthDate.getFullYear();

  let d2 = now.getDate();
  let m2 = 1 + now.getMonth();
  let y2 = now.getFullYear();
  const month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (d1 > d2) {
    d2 = d2 + month[m2 - 1];
    m2 = m2 - 1;
  }
  if (m1 > m2) {
    m2 = m2 + 12;
    y2 = y2 - 1;
  }
  const days = d2 - d1;
  const months = m2 - m1;
  const years = y2 - y1;
  return [years, months, days] as const;
};

// Dynamic age
export function prepareDynamicAge(blocks: Block[]) {
  const [age] = getAgeFromBirthDate(new Date("1992-11-02"));
  const inner = (_blocks: typeof blocks) => {
    for (let block of _blocks) {
      if ((block as any).code?.codeHtml) {
        (block as any).code.codeHtml = (block as any).code.codeHtml.replace(
          /\d+ år gammel/,
          `${age} år gammel`,
        );
        return true;
      }
      if (block.has_children) {
        let result = inner((block as any)[block.type].children);
        if (result) return true;
      }
    }
    return false;
  };
  inner(blocks);
}
