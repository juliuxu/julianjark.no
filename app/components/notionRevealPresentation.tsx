import { Render } from "@9gustin/react-notion-render";
import { useEffect, useState } from "react";
import Reveal from "reveal.js";
import RevealNotes from "reveal.js/plugin/notes/notes";

import type { PreparedData } from "~/routes/presentasjoner/$presentasjon";
import Code from "./code";

type Props = PreparedData;
export default function NotionRevealPresentation({
  slides,
  properties,
}: Props) {
  const [_, setDeck] = useState<Reveal | undefined>(undefined);
  useEffect(() => {
    let newDeck = new Reveal({
      hash: true,
      slideNumber: properties["Slide number"],
      transition: properties.Transition,
      progress: !properties["Hide progress bar"],
      controls: !properties["Hide controls"],
      plugins: [RevealNotes],
    });
    setDeck(newDeck);

    newDeck.initialize();
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

        {slides.map((slide) => (
          <section>
            <aside className="notes">
              <Render blocks={slide.notes as any} />
            </aside>
            <Render blocks={slide.content as any} />

            {/* Vertical subslides */}
            {slide.subSlides.map((subSlide) => (
              <section>
                <aside className="notes">
                  <Render blocks={subSlide.notes as any} />
                </aside>
                <Render blocks={subSlide.content as any} />
              </section>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
