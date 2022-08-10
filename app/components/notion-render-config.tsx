import type { SelectColor } from "~/notion/notion.types";
import type { Classes } from "~/packages/notion-render/classes";
import type { Components } from "~/packages/notion-render/components";
import { ShikiNotionCode } from "~/packages/notion-shiki-code/shiki-notion";
import { buildOptimizedNotionImage } from "./notion-components";

export const notionSelectClasses: Record<SelectColor, string> = {
  default: "text-white",
  gray: "text-gray-400",
  brown: "text-amber-700",
  orange: "text-orange-400",
  yellow: "text-yellow-400",
  green: "text-green-400",
  blue: "text-blue-400",
  purple: "text-purple-400",
  pink: "text-pink-400",
  red: "text-red-400",
};

export const notionRenderClasses: Partial<Classes> /*tw*/ = {
  column_list: {
    root: "grid gap-4 grid-cols-1 lg:grid-flow-col lg:auto-cols-fr",
  },
  column: { root: "" },
  image: { root: "rounded-lg" },
  code: { root: "text-white" },

  annotation_code: "text-red-500 bg-[#1E1E1E] ring-[#1E1E1E] ring-2 rounded-sm",

  color_default: "text-white",
  color_gray: "text-gray-400",
  color_brown: "text-amber-700",
  color_orange: "text-orange-400",
  color_yellow: "text-yellow-400",
  color_green: "text-green-400",
  color_blue: "text-blue-400",
  color_purple: "text-purple-400",
  color_pink: "text-pink-400",
  color_red: "text-red-400",
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
