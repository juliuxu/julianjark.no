import type { SelectColor } from "~/notion/notion.types";
import type { Classes } from "~/packages/notion-render/classes";
import type { Components } from "~/packages/notion-render/components";
import { ShikiNotionCode } from "~/packages/notion-shiki-code/shiki-notion";
import { buildOptimizedNotionImage } from "./notion-components";

const common = `py-1 px-2 rounded`;
export const notionSelectClasses: Record<SelectColor, string> /*tw*/ = {
  default: `text-gray-900 bg-gray-100 ${common}`,
  gray: `text-gray-900 bg-gray-300 ${common}`,
  brown: `text-amber-200 bg-amber-900 ${common}`,
  orange: `text-orange-200 bg-orange-900 ${common}`,
  yellow: `text-yellow-200 bg-yellow-900 ${common}`,
  green: `text-green-200 bg-green-900 ${common}`,
  blue: `text-blue-200 bg-blue-900 ${common}`,
  purple: `text-purple-200 bg-purple-900 ${common}`,
  pink: `text-pink-200 bg-pink-900 ${common}`,
  red: `text-red-200 bg-red-900 ${common}`,
};

export const notionRenderClasses: Partial<Classes> /*tw*/ = {
  column_list: {
    root: "grid gap-0 sm:gap-8 lg:gap-10 grid-cols-1 sm:grid-flow-col sm:auto-cols-fr",
  },
  // column: { root: "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0" },
  image: { root: "rounded-lg" },

  callout: {
    root: "flex gap-2 ring-1 p-4 rounded whitespace-pre-wrap",
    icon: "text-2xl",
  },

  toggle: { root: "cursor-default", summary: "[&>*]:inline" },

  annotation_code:
    "text-red-500 bg-[#1E1E1E] ring-[#1E1E1E] ring-2 rounded-sm px-1 before:content-none after:content-none",

  color_default: "",
  color_gray: "text-gray-400",
  color_brown: "text-amber-700",
  color_orange: "text-orange-400",
  color_yellow: "text-yellow-400",
  color_green: "text-green-400",
  color_blue: "text-blue-400",
  color_purple: "text-purple-400",
  color_pink: "text-pink-400",
  color_red: "text-red-500",
  color_gray_background: "bg-gray-400",
  color_brown_background: "text-amber-700",
  color_orange_background: "text-orange-400",
  color_yellow_background: "text-yellow-400",
  color_green_background: "text-green-400",
  color_blue_background: "text-blue-400",
  color_purple_background: "text-purple-400",
  color_pink_background: "text-pink-400",
  color_red_background: "text-red-400",
};
export const notionRenderComponents: Partial<Components> = {
  code: ShikiNotionCode,
  image: buildOptimizedNotionImage(),
};
