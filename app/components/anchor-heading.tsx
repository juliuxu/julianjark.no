interface AnchorHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as: "h1" | "h2" | "h3";
  id: string;
  children: React.ReactNode;
  className?: string;
}

const linkColor = "text-cyan-400";

// Variant 1: Icon on left side
export const AnchorHeading1 = ({
  as: Component,
  children,
  className,
  id,
  ...rest
}: AnchorHeadingProps) => {
  return (
    <Component className={`group relative ${className}`} id={id} {...rest}>
      <a
        href={`#${id}`}
        className={`absolute -left-6 w-6 opacity-0 transition-opacity hover:underline group-hover:opacity-100 ${linkColor}`}
      >
        #
      </a>
      {children}
    </Component>
  );
};

// Variant 2: Icon on right side
export const AnchorHeading2 = ({
  as: Component,
  children,
  className,
  id,
  ...rest
}: AnchorHeadingProps) => {
  return (
    <Component className={`group ${className}`} id={id} {...rest}>
      {children}
      <a
        href={`#${id}`}
        className={`pl-2 opacity-0 transition-opacity hover:underline group-hover:opacity-100 ${linkColor}`}
      >
        #
      </a>
    </Component>
  );
};

// Variant 3: Whole anchor is a link
export const AnchorHeading3 = ({
  as: Component,
  children,
  className,
  id,
  ...rest
}: AnchorHeadingProps) => {
  return (
    <Component className={`${className}`} id={id} {...rest}>
      <a href={`#${id}`} className="hover:underline">
        {children}
      </a>
    </Component>
  );
};

export const AnchorHeading = AnchorHeading2;
