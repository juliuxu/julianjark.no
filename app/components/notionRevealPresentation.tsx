import { Render } from "@9gustin/react-notion-render";
import { useEffect, useState } from "react";
import Reveal from "reveal.js";
import RevealNotes from "reveal.js/plugin/notes/notes";

import type { PreparedData } from "~/routes/presentasjoner/$presentasjon";

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
      plugins: [RevealNotes],
    });
    setDeck(newDeck);

    newDeck.initialize();
  }, []);

  return (
    <div className="reveal">
      <div className="slides">
        {process.env.NODE_ENV === "development" && (
          <section data-visibility="shown">
            {/* <Code language="json" code={JSON.stringify(properties, null, 2)} /> */}
          </section>
        )}

        {slides.map((slide) => (
          <section>
            <aside className="notes">
              <Render blocks={slide.notes as any} />
            </aside>
            <Render blocks={slide.content as any} />
          </section>
        ))}
      </div>
    </div>
  );
}
