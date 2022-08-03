import { getText } from "~/notion/notion";
import { getCheckbox, getSelect, getTextFromRichText } from "~/notion/notion";
import type { Block } from "~/notion/notion.types";
import type { DatabasePage } from "~/notion/notion-api.server";
import type { Theme } from "~/routes/presentasjoner.$presentasjon";
import { getThemeOrDefault } from "~/routes/presentasjoner.$presentasjon";

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
  page: DatabasePage,
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
const HIDE_HEADING_TOKENS = ["—", "~"];

export const prepareSlides = (blocks: Block[]): Slide[] => {
  // STEP: Remove unsupported blocks
  const filteredBlocks = blocks.filter(
    (block) => block.type !== "divider" && block.type !== "table_of_contents",
  );

  // Figure out if we are using h1 or h2 as slide dividers
  const firstHeadingBlock = filteredBlocks.find(
    (block) => block.type === "heading_1" || block.type === "heading_2",
  );
  let headingTypeLevel1: "heading_1" | "heading_2";
  let headingTypeLevel2: "heading_2" | "heading_3";
  if (firstHeadingBlock?.type === "heading_1") {
    headingTypeLevel1 = "heading_1";
    headingTypeLevel2 = "heading_2";
  } else {
    headingTypeLevel1 = "heading_2";
    headingTypeLevel2 = "heading_3";
  }

  // Group level 1
  let level1 = groupByBlockType(headingTypeLevel1, filteredBlocks);

  // Group level 2
  let level2 = level1.map((blockList): SlideWithoutNotes => {
    const blockListInner = blockList.slice();
    let content: Block[] = [];

    // Take while we have not encountered a h2_heading
    while (true) {
      if (
        blockListInner[0] === undefined ||
        blockListInner[0].type === headingTypeLevel2
      ) {
        break;
      }
      content.push(blockListInner.shift()!);
    }

    // Group the rest based on h2 headings into subSlides
    const subSlides = groupByBlockType(headingTypeLevel2, blockListInner).map(
      (content) => ({ content }),
    );

    return {
      content,
      subSlides,
    };
  });

  // Extract notes
  const extractNotes = (
    withoutNotes: SlideWithoutNotes | SubSlideWithoutNotes,
  ) => {
    const notes = withoutNotes.content.filter(
      (block) => block.type === NOTES_BLOCK_TYPE,
    );
    const content = withoutNotes.content.filter(
      (block) => block.type !== NOTES_BLOCK_TYPE,
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
      HIDE_HEADING_TOKENS.some((token) =>
        getTextFromRichText((block as any)[block.type].rich_text).startsWith(
          token,
        ),
      )
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
