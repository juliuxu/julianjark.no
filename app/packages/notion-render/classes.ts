import { RichTextItem } from "~/service/notion.types";
import { DefaultComponents } from "./components";

type ClassDefintion = {
  root: string;
  [someOtherKey: string]: string;
};

type RichTextAnnotation = Exclude<keyof RichTextItem["annotations"], "color">;
type RichTextColor = RichTextItem["annotations"]["color"];
type RichTextAnnotationClass = `annotation_${RichTextAnnotation}`;
type RichTextColorClass = `color_${RichTextColor}`;

export type Classes = Record<keyof typeof DefaultComponents, ClassDefintion> &
  Record<RichTextAnnotationClass | RichTextColorClass, string>;

// Classes
export const EmptyClasses: Classes = {
  annotation_bold: "",
  annotation_code: "",
  annotation_italic: "",
  annotation_strikethrough: "",
  annotation_underline: "",

  color_default: "",
  color_gray: "",
  color_brown: "",
  color_orange: "",
  color_yellow: "",
  color_green: "",
  color_blue: "",
  color_purple: "",
  color_pink: "",
  color_red: "",
  color_gray_background: "",
  color_brown_background: "",
  color_orange_background: "",
  color_yellow_background: "",
  color_green_background: "",
  color_blue_background: "",
  color_purple_background: "",
  color_pink_background: "",
  color_red_background: "",

  paragraph: {
    root: "",
  },
  heading_1: {
    root: "",
  },
  heading_2: {
    root: "",
  },
  heading_3: {
    root: "",
  },
  bulleted_list_item: {
    root: "",
  },
  numbered_list_item: {
    root: "",
  },
  quote: {
    root: "",
  },
  to_do: {
    root: "",
  },
  toggle: {
    root: "",
  },
  template: {
    root: "",
  },
  synced_block: {
    root: "",
  },
  child_page: {
    root: "",
  },
  child_database: {
    root: "",
  },
  equation: {
    root: "",
  },
  code: {
    root: "",
  },
  callout: {
    root: "",
  },
  divider: {
    root: "",
  },
  breadcrumb: {
    root: "",
  },
  table_of_contents: {
    root: "",
  },
  column_list: {
    root: "",
  },
  column: {
    root: "",
  },
  link_to_page: {
    root: "",
  },
  table: {
    root: "",
  },
  table_row: {
    root: "",
  },
  embed: {
    root: "",
  },
  bookmark: {
    root: "",
  },
  image: {
    root: "",
  },
  video: {
    root: "",
  },
  pdf: {
    root: "",
  },
  file: {
    root: "",
  },
  audio: {
    root: "",
  },
  link_preview: {
    root: "",
  },
  unsupported: {
    root: "",
  },
  bulleted_list: {
    root: "",
  },
  numbered_list: {
    root: "",
  },
};
