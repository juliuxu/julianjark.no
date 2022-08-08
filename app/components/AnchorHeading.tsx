interface AnchorHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as: "h1" | "h2" | "h3";
  id: string;
  children: React.ReactNode;
  className?: string;
}

// Variant 1: Icon on left side
export const AnchorHeading = ({
  as: Component,
  children,
  className,
  id,
  ...rest
}: AnchorHeadingProps) => {
  return (
    <Component className={`relative group ${className}`} id={id} {...rest}>
      <a
        href={`#${id}`}
        className="absolute -left-6 w-6 hover:underline opacity-0 group-hover:opacity-100 "
      >
        #
      </a>
      {children}
    </Component>
  );
};

// Variant 2: Icon on right side
// TODO

// Variant 3: Whole anchor is a link
// TODO
