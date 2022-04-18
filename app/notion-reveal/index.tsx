import { useEffect, useRef, useState } from "react";
import Reveal from "reveal.js";
import RevealNotes from "reveal.js/plugin/notes/notes";
import Code from "~/components/code";
import NotionRender from "~/notion-render";
import { Classes as NotionRenderClasses } from "~/notion-render/classes";
import type { PreparedData } from "./prepare";

// Classes
const classes: Partial<NotionRenderClasses> = {
  column_list: { root: "r-hstack" },
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

        {slides.map((slide, index) => (
          <section key={index}>
            <aside className="notes">
              <NotionRender classes={classes} blocks={slide.notes} />
            </aside>
            <NotionRender classes={classes} blocks={slide.content} />

            {/* Vertical subslides */}
            {slide.subSlides.map((subSlide, index2) => (
              <section key={index2}>
                <aside className="notes">
                  <NotionRender classes={classes} blocks={subSlide.notes} />
                </aside>
                <NotionRender classes={classes} blocks={subSlide.content} />
              </section>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
