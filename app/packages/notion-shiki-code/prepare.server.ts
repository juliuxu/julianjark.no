import type { Lang, Theme } from "shiki";
import * as shiki from "shiki";

import type { Block } from "~/notion/notion.types";
import { getPlainTextFromRichTextList } from "~/packages/notion-render/components";

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

const parseCaption = (
  caption: string,
): {
  language?: string;
  filename?: string;
  linenumbers?: string;
  highlight?: string;
  copy?: string;
} => {
  const params = Object.fromEntries(new URLSearchParams(caption));
  return params as Partial<typeof params>;
};

const prepareNotionBlock = async (
  block: Block,
  highlighter: shiki.Highlighter,
) => {
  if (block.type !== "code") return;

  const { language, filename, linenumbers, copy, highlight } = parseCaption(
    getPlainTextFromRichTextList(block.code.caption),
  );

  const lineOptions: LineOption[] = [];
  if (highlight) {
    // parse
    // comma seperated
    // case 1: single number
    // case 2: range
    // e.g. 1,4,7-10
    const highlightLines = highlight
      .split(",")
      .flatMap((section) => {
        const split = section.split("-");
        // case 1: single number
        if (split.length === 1) return Number.parseInt(split[0]);

        // case 2: range
        const first = Number.parseInt(split[0]);
        const second = Number.parseInt(split[1]);
        if (!Number.isInteger(first) || !Number.isInteger(second)) return NaN;

        return [...Array(second - first + 1).keys()].map((x) => x + first);
      })
      .filter(Number.isInteger);

    highlightLines.forEach((line) => {
      lineOptions.push({ line, classes: ["highlight"] });
    });
  }

  let shikiCodeHtml = highlighter.codeToHtml(
    getPlainTextFromRichTextList(block.code.rich_text),
    { lang: language ?? block.code.language, lineOptions },
  );

  // Add foreground and background variables
  shikiCodeHtml = shikiCodeHtml.replace(
    `<pre class="shiki" style="`,
    `<pre class="shiki" style="--shiki-foreground: ${highlighter.getForegroundColor()}; --shiki-background: ${highlighter.getBackgroundColor()};`,
  );

  // We could create our own renderer, probably better
  if (filename) {
    shikiCodeHtml = shikiCodeHtml.replace(
      `<pre`,
      `<pre data-filename="${filename}"`,
    );
  }
  if (copy === "true") {
    shikiCodeHtml = shikiCodeHtml.replace(`<pre`, `<pre data-copy="true"`);
  }
  if (linenumbers === "true") {
    shikiCodeHtml = shikiCodeHtml.replace(
      `<pre`,
      `<pre data-line-numbers="true"`,
    );
  }

  (block.code as any).shikiCodeHtml = shikiCodeHtml;
};

// Mutates the given list
// TODO: Update psuedo ListBlock block.bullet_list.children instead of block.children
export const prepareNotionBlocks = async (
  blocks: Block[],
  options: Omit<Options, "lang">,
) => {
  const highlighter = await shiki.getHighlighter({ theme: options.theme });

  const innerF = (innerBlocks: Block[]) =>
    innerBlocks.forEach((block) => {
      prepareNotionBlock(block, highlighter);
      if (block.has_children) {
        innerF((block as any)[block.type]?.children ?? []);
      }
    });
  innerF(blocks);
};

// Hack to make sure the required files are bundled
if (
  Math.random() + "" ===
  "THIS_IS_JUST_TO_MAKE_SURE_THE_CODE_BELOW_IS_INCLUDED"
) {
  console.log(hack());
}
export function hack() {
  const { readFileSync } = require("fs");
  let a: any[] = [];

  // Themes
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/css-variables.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/dark-plus.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/dracula-soft.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/dracula.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/github-dark-dimmed.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/github-dark.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/github-light.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/hc_light.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/light-plus.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/material-darker.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/material-default.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/material-lighter.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/material-ocean.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/material-palenight.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/min-dark.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/min-light.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/monokai.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/nord.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/one-dark-pro.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/poimandres.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/rose-pine-dawn.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/rose-pine-moon.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/rose-pine.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/slack-dark.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/slack-ochin.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/solarized-dark.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/solarized-light.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/vitesse-dark.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/themes/vitesse-light.json",
      "utf8",
    ),
  );

  // Languages
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/abap.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() +
        "/node_modules/shiki/languages/actionscript-3.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/ada.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/apache.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/apex.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/apl.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() +
        "/node_modules/shiki/languages/applescript.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/asm.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/astro.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/awk.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/ballerina.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/bat.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/berry.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/bibtex.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/bicep.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/blade.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/c.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/cadence.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/clarity.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/clojure.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/cmake.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/cobol.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/codeql.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/coffee.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/cpp-macro.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/cpp.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/crystal.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/csharp.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/css.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/cue.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/d.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/dart.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/diff.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/docker.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() +
        "/node_modules/shiki/languages/dream-maker.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/elixir.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/elm.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/erb.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/erlang.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/fish.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/fsharp.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/gherkin.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() +
        "/node_modules/shiki/languages/git-commit.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() +
        "/node_modules/shiki/languages/git-rebase.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/glsl.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/gnuplot.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/go.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/graphql.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/groovy.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/hack.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/haml.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() +
        "/node_modules/shiki/languages/handlebars.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/haskell.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/hcl.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/hlsl.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/html.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/ini.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/java.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() +
        "/node_modules/shiki/languages/javascript.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() +
        "/node_modules/shiki/languages/jinja-html.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/jinja.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/json.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/jsonc.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/jsonnet.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/jssm.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/jsx.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/julia.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/kotlin.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/latex.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/less.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/liquid.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/lisp.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/logo.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/lua.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/make.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/markdown.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/marko.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/matlab.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/mdx.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/mermaid.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/nginx.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/nim.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/nix.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() +
        "/node_modules/shiki/languages/objective-c.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() +
        "/node_modules/shiki/languages/objective-cpp.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/ocaml.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/pascal.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/perl.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/php-html.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/php.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/plsql.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/postcss.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() +
        "/node_modules/shiki/languages/powershell.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/prisma.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/prolog.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/pug.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/puppet.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() +
        "/node_modules/shiki/languages/purescript.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/python.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/r.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/raku.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/razor.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/rel.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/riscv.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/rst.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/ruby.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/rust.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/sas.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/sass.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/scala.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/scheme.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/scss.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/shaderlab.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() +
        "/node_modules/shiki/languages/shellscript.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/smalltalk.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/solidity.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/sparql.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/sql.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() +
        "/node_modules/shiki/languages/ssh-config.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/stata.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/stylus.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/svelte.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/swift.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() +
        "/node_modules/shiki/languages/system-verilog.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/tasl.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/tcl.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/tex.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/toml.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/tsx.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/turtle.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/twig.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() +
        "/node_modules/shiki/languages/typescript.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/vb.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/verilog.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/vhdl.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/viml.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/vue-html.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/vue.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/wasm.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/wenyan.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/xml.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/xsl.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/yaml.tmLanguage.json",
      "utf8",
    ),
  );
  a.push(
    readFileSync(
      process.cwd() + "/node_modules/shiki/languages/zenscript.tmLanguage.json",
      "utf8",
    ),
  );
  return a;
}
