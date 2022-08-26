import { optimizedImageUrl } from "~/utils";

type OptimizedImageProps = {
  src: string;
} & React.DetailedHTMLProps<
  React.ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>;
export const OptimizedImage = ({ src, ...rest }: OptimizedImageProps) => {
  let url = src;

  // Optimize Image
  url = optimizedImageUrl(url);

  // TODO: Screen size optimizations

  return <img src={url} alt={rest.alt} {...rest} />;
};
