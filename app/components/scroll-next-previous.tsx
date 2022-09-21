import { useShortcut } from "./use-shortcut";

interface FloatingScrollNextPreviousButtonsProps {
  articleIds: string[];
}
export const FloatingScrollNextPreviousButtons = ({
  articleIds,
}: FloatingScrollNextPreviousButtonsProps) => {
  const onNext = () => {
    // https://awik.io/check-if-element-is-inside-viewport-with-javascript/
    // https://gomakethings.com/how-to-test-if-an-element-is-in-the-viewport-with-vanilla-javascript/
    function isArticleHighUpInViewport(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      return rect.top <= 50 && rect.bottom > 0;
    }

    // Get the active article
    // and select the next one
    let nextId = articleIds[0];
    for (const [i, id] of articleIds.entries()) {
      const element = document.getElementById(id);
      const parentArticle = element?.closest("article");
      if (!parentArticle) continue;
      if (isArticleHighUpInViewport(parentArticle)) {
        if (i + 1 < articleIds.length) nextId = articleIds[i + 1];
        else nextId = "";
        break;
      }
    }
    if (!nextId) return;

    // Scroll into view
    const element = document.getElementById(nextId);
    if (!element) return;

    element.scrollIntoView({
      block: "start",
      behavior: "smooth",
    });
  };
  const onPrevious = () => {
    function isArticleHighUpInViewport(element: HTMLElement) {
      const rect = element.getBoundingClientRect();
      return rect.top <= 60 && rect.bottom >= -50;
    }

    let nextId = "";
    for (const [i, id] of articleIds.entries()) {
      const element = document.getElementById(id);
      const parentArticle = element?.closest("article");
      if (!parentArticle) continue;
      if (isArticleHighUpInViewport(parentArticle)) {
        if (i < articleIds.length) nextId = articleIds[i];
        else nextId = "";
        break;
      }
    }
    if (!nextId) return;

    // Scroll into view
    const element = document.getElementById(nextId);
    if (!element) return;

    element.scrollIntoView({
      block: "start",
      behavior: "smooth",
    });
  };

  useShortcut("j", onNext);
  useShortcut("k", onPrevious);

  return (
    <div className="fixed bottom-8 right-8 flex flex-col">
      <button
        aria-hidden
        onClick={onPrevious}
        className="text-[8vw] sm:text-[6vw] md:text-[4vw] hover:scale-125 active:scale-150 transition-all"
      >
        ⬆️
      </button>
      <button
        aria-hidden
        onClick={onNext}
        className="text-[8vw] sm:text-[6vw] md:text-[4vw] hover:scale-125 active:scale-150 transition-all"
      >
        ⬇️
      </button>
    </div>
  );
};
