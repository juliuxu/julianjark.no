import { getText } from "~/service/notion";
import { getCheckbox, getSelect, getTextFromRichText } from "~/service/notion";
import type { DatabasePage } from "~/service/notionApi.server";

import { Block } from "~/service/notion.types";
import {
  getThemeOrDefault,
  Theme,
} from "~/routes/presentasjoner/$presentasjon";

export interface PreparedData {
  slides: Slide[];
  properties: PresentationProperties;
}

const transitions = [
  "none",
  "fade",
  "slide",
  "convex",
  "concave",
  "zoom",
] as const;
type Transition = typeof transitions[number];
const defaultTransition: Transition = "slide";

export type PresentationProperties = {
  Ingress?: string;
  Theme: Theme;
  "Slide number": boolean;
  Transition: Transition;
  "Hide progress bar": boolean;
  "Hide controls": boolean;
  "Show debug slides": boolean;
};
export const parsePresentationProperties = (
  page: DatabasePage
): PresentationProperties => {
  const themeProperty = getSelect("Theme", page) ?? "";
  const transitionProperty = getSelect("Transition", page) ?? "";
  const result: PresentationProperties = {
    Ingress: getText("Ingress", page),
    Theme: getThemeOrDefault(themeProperty),

    Transition: transitions.includes(transitionProperty as Transition)
      ? (transitionProperty as Transition)
      : defaultTransition,

    "Slide number": getCheckbox("Slide number", page) ?? false,
    "Hide progress bar": getCheckbox("Hide progress bar", page) ?? false,
    "Hide controls": getCheckbox("Hide controls", page) ?? false,
    "Show debug slides": getCheckbox("Show debug slides", page) ?? false,
  };
  return result;
};

const groupByBlockType = (type: Block["type"], blocks: Block[]) => {
  const groups: Block[][] = [];
  let currentGroup: Block[] = [];
  for (const block of blocks) {
    if (block.type === type) {
      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      }
      currentGroup = [];
    }
    currentGroup.push(block);
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};

export interface Slide {
  notes: Block[];
  content: Block[];
  subSlides: SubSlide[];
}
export interface SubSlide {
  notes: Block[];
  content: Block[];
}

interface SlideWithoutNotes {
  content: Block[];
  subSlides: SubSlideWithoutNotes[];
}
interface SubSlideWithoutNotes {
  content: Block[];
}

// Config
const NOTES_BLOCK_TYPE = "callout";
const HIDE_HEADING_TOKEN = "—";

export const prepareSlides = (blocks: Block[]): Slide[] => {
  // STEP: Remove unsupported blocks
  const filteredBlocks = blocks.filter(
    (block) => block.type !== "divider" && block.type !== "table_of_contents"
  );

  // Group level 1
  let level1 = groupByBlockType("heading_1", filteredBlocks);

  // Group level 2
  let level2 = level1.map((blockList): SlideWithoutNotes => {
    const blockListInner = blockList.slice();
    let content: Block[] = [];

    // Take while we have not encountered a h2_heading
    while (true) {
      if (
        blockListInner[0] === undefined ||
        blockListInner[0].type === "heading_2"
      ) {
        break;
      }
      content.push(blockListInner.shift()!);
    }

    // Group the rest based on h2 headings into subSlides
    const subSlides = groupByBlockType("heading_2", blockListInner).map(
      (content) => ({ content })
    );

    return {
      content,
      subSlides,
    };
  });

  // Extract notes
  const extractNotes = (
    withoutNotes: SlideWithoutNotes | SubSlideWithoutNotes
  ) => {
    const notes = withoutNotes.content.filter(
      (block) => block.type === NOTES_BLOCK_TYPE
    );
    const content = withoutNotes.content.filter(
      (block) => block.type !== NOTES_BLOCK_TYPE
    );
    return { notes, content };
  };

  let slides: Slide[] = level2.map((slideWithoutNotes) => ({
    ...extractNotes(slideWithoutNotes),
    subSlides: slideWithoutNotes.subSlides.map(extractNotes),
  }));

  // Remove heading blocks matching the configured token
  // They mean we don't want a visible heading
  const removeHiddenHeadingsPredicate = (block: Block) => {
    const headingBlockTypes: Block["type"][] = [
      "heading_1",
      "heading_2",
      "heading_3",
    ];
    if (
      headingBlockTypes.includes(block.type) &&
      getTextFromRichText((block as any)[block.type].rich_text) ===
        HIDE_HEADING_TOKEN
    ) {
      return false;
    }
    return true;
  };
  slides = slides.map((slide) => ({
    notes: slide.notes,
    content: slide.content.filter(removeHiddenHeadingsPredicate),
    subSlides: slide.subSlides.map((subSlide) => ({
      ...subSlide,
      content: subSlide.content.filter(removeHiddenHeadingsPredicate),
    })),
  }));

  return slides;
};
