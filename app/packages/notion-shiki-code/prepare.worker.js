// @ts-check
import shiki from "shiki";

/**
 * @type shiki.Highlighter
 */
let highlighter;

/**
 * https://kentcdodds.com/blog/fixing-a-memory-leak-in-a-production-node-js-app#shiki-fix
 *
 * @typedef {import('./prepare.server').Options} Options
 *
 * @typedef {object} Props
 * @property {string} codeText
 * @property {Options} options
 *
 * @param {Props} props
 */
export default async function prepare({ codeText, options }) {
  if (!highlighter) {
    highlighter = await shiki.getHighlighter({ theme: "dark-plus" });
  }
  if (options.theme && !highlighter.getLoadedThemes().includes(options.theme)) {
    await highlighter.loadTheme(options.theme);
  }
  if (!highlighter.getLoadedLanguages().includes(options.lang)) {
    await highlighter.loadLanguage(options.lang);
  }

  return {
    codeHtml: highlighter.codeToHtml(codeText, options),
    foregroundColor: highlighter.getForegroundColor(),
    backgroundColor: highlighter.getBackgroundColor(),
  };
}
