import type { ImageResource } from "~/notion/notion";
import { unpicTransformer } from "~/utils";
import { dranksClasses } from "./route";

interface FooterProps {
  images: Record<"sitroner" | "last-ned-fra-app-store", ImageResource>;
}
export const Footer = ({ images }: FooterProps) => {
  return (
    <footer
      className={`mt-14 flex h-72 w-full bg-dranks-orange ${dranksClasses.layoutPadding}`}
    >
      <div className="flex-grow" />
      <div className="flex flex-col justify-between">
        <div className="-mt-12">
          <img
            src={unpicTransformer({ url: images["sitroner"].src })?.toString()}
            alt={images["sitroner"].alt}
            className="-top-12 w-36 rotate-6"
          />
        </div>
        <a href="#todo-app-link" className="flex justify-center">
          <img
            src={unpicTransformer({
              url: images["last-ned-fra-app-store"].src,
            })?.toString()}
            alt={images["last-ned-fra-app-store"].alt}
          />
        </a>
        <div />
      </div>
    </footer>
  );
};
