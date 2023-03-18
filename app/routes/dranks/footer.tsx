import { OptimizedImage } from "~/components/optimized-image";
import type { ImageResource } from "~/notion/notion";
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
          <OptimizedImage
            {...images["sitroner"]}
            className="-top-12 w-36 rotate-6"
          />
        </div>
        <a href="#todo-app-link" className="flex justify-center">
          <OptimizedImage {...images["last-ned-fra-app-store"]} />
        </a>
        <div />
      </div>
    </footer>
  );
};
