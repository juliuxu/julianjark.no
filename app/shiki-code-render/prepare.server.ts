import * as shiki from "shiki";
import type { Lang, Theme } from "shiki";

interface LineOption {
  line: number;
  classes?: string[];
}
export interface Options {
  lang: Lang;
  theme?: Theme;
  lineOptions?: LineOption[];
}
export default async function prepare(codeText: string, options: Options) {
  const highlighter = await shiki.getHighlighter({ theme: options.theme });
  return highlighter.codeToHtml(codeText, options);
}
