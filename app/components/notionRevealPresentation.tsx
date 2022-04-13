import { Render } from "@9gustin/react-notion-render";
import { LinksFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import Reveal from "reveal.js";
import revealCss from "reveal.js/dist/reveal.css";
import revealBlackTheme from "reveal.js/dist/theme/black.css";
import type { Block } from "~/service/notion.types";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: revealCss },
  { rel: "stylesheet", href: revealBlackTheme },
];

interface SlideProps {
  blocks: Block[];
}
const Slide = ({ blocks }: SlideProps) => {
  return <>A single slide</>;
};

interface Props {
  slides: Block[][];
}

export default function NotionRevealPresentation(props: Props) {
  const [deck, setDeck] = useState(undefined);
  useEffect(() => {
    let newDeck = new Reveal({});
    setDeck(newDeck);

    newDeck.initialize();
  }, []);
  return (
    <div className="reveal">
      <div className="slides">
        {props.slides.map((slide) => (
          <section>
            <Render blocks={slide as any} />
          </section>
        ))}
      </div>
    </div>
  );
}
