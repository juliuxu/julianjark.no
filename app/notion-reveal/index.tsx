import { useEffect } from "react";
import NotionRender from "~/notion-render";
import { Classes as NotionRenderClasses } from "~/notion-render/classes";
import {
  Components as NotionRenderComponents,
  getPlainTextFromRichTextList,
} from "~/notion-render/components";
import type { PreparedData, Slide, SubSlide } from "./prepare";

// Notion Render Classes
const classes: Partial<NotionRenderClasses> = {
  column_list: { root: "r-hstack" },
};
const components: Partial<NotionRenderComponents> = {
  code: ({ block }) => {
    if (block.type !== "code") return null;
    return (
      <pre>
        <code
          className={`language-${block.code.language}`}
          data-line-numbers={getPlainTextFromRichTextList(block.code.caption)}
        >
          {getPlainTextFromRichTextList(block.code.rich_text)}
        </code>
      </pre>
    );
  },
};

const links = [
  "/reveal/dist/reset.css",
  "/reveal/dist/reveal.css",
  "/reveal/dist/theme/black.css",
  "/reveal/plugin/highlight/monokai.css",
];
const scripts = [
  "/reveal/dist/reveal.js",
  "/reveal/plugin/notes/notes.js",
  "/reveal/plugin/highlight/highlight.js",
];

type Props = PreparedData;
export default function NotionRevealPresentation({
  slides,
  properties,
}: Props) {
  useEffect(() => {
    // @ts-ignore
    Reveal.initialize({
      hash: true,
      slideNumber: properties["Slide number"],
      transition: properties.Transition,
      progress: !properties["Hide progress bar"],
      controls: !properties["Hide controls"],
      // @ts-ignore
      plugins: [RevealHighlight, RevealNotes],

      // This would get really annoying during a live presentation
      // It will start nudging at the first vertical slide
      controlsTutorial: false,
    });
  }, []);

  const renderSlide = (slide: Slide | SubSlide, index: number) => (
    <section key={index}>
      <aside className="notes">
        <NotionRender
          components={components}
          classes={classes}
          blocks={slide.notes}
        />
      </aside>
      <NotionRender
        components={components}
        classes={classes}
        blocks={slide.content}
      />

      {/* Vertical subslides */}
      {"subSlides" in slide && slide.subSlides.map(renderSlide)}
    </section>
  );

  return (
    <>
      <div className="reveal">
        <div className="slides">{slides.map(renderSlide)}</div>
      </div>

      {links.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      {scripts.map((src) => (
        <script src={src} />
      ))}
    </>
  );
}
