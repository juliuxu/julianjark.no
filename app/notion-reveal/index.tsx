import { useEffect, useRef } from "react";
import Reveal from "reveal.js";
import RevealNotes from "reveal.js/plugin/notes/notes";
import Code from "~/components/prismCode";
import NotionRender from "~/notion-render";
import type { Classes as NotionRenderClasses } from "~/notion-render/classes";
import {
  Components as NotionRenderComponents,
  getPlainTextFromRichTextList,
} from "~/notion-render/components";
import type { PreparedData, Slide, SubSlide } from "./prepare";

// Classes
const classes: Partial<NotionRenderClasses> = {
  column_list: { root: "r-hstack" },
};
const components: Partial<NotionRenderComponents> = {
  code: ({ block }) => {
    if (block.type !== "code") return null;
    return (
      <Code
        language={block.code.language}
        code={getPlainTextFromRichTextList(block.code.rich_text)}
      />
    );
  },
};

type Props = PreparedData;
export default function NotionRevealPresentation({
  slides,
  properties,
}: Props) {
  const deck = useRef<Reveal>();
  useEffect(() => {
    let newDeck = new Reveal({
      hash: true,
      slideNumber: properties["Slide number"],
      transition: properties.Transition,
      progress: !properties["Hide progress bar"],
      controls: !properties["Hide controls"],
      plugins: [RevealNotes],

      // This would get really annoying during a live presentation
      // It will start nudging at the first vertical slide
      controlsTutorial: false,
    });
    newDeck.initialize();
    deck.current = newDeck;
  }, []);

  const renderSlide = (slide: Slide | SubSlide, index: number) => (
    <section key={index}>
      {slide.notes && (
        <aside className="notes">
          <NotionRender
            components={components}
            classes={classes}
            blocks={slide.notes}
          />
        </aside>
      )}
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
    <div className="reveal">
      <div className="slides">
        {properties["Show debug slides"] && (
          <>
            <section>
              <h2>Properties</h2>
              <Code
                language="json"
                code={JSON.stringify(properties, null, 2)}
              />
            </section>
            <section>
              <h2>Slides</h2>
              <Code language="json" code={JSON.stringify(slides, null, 2)} />
            </section>
          </>
        )}

        {slides.map(renderSlide)}
      </div>
    </div>
  );
}
