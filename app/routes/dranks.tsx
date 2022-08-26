import type { LinksFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";

import config from "~/config.server";
import { getFileUrl, getText, getTitle } from "~/notion/notion";
import { getDatabasePages } from "~/notion/notion-api.server";
import fontComico from "~/styles/font-comico.css";
import fontSatoshi from "~/styles/font-satoshi.css";
import tailwind from "~/tailwind.css";
import {
  assertContainsItems,
  optimizedImageUrl,
  rewriteNotionImageUrl,
} from "~/utils";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: tailwind,
  },
  {
    rel: "stylesheet",
    href: fontComico,
  },
  {
    rel: "stylesheet",
    href: fontSatoshi,
  },
];

export const meta: MetaFunction = () => ({
  "theme-color": "#F9A613",
});

interface Image {
  url: string;
  alt: string;
}

export const loader = async () => {
  const imageNames = ["sitroner", "last-ned-fra-app-store"] as const;

  const resources = await getDatabasePages(
    config.resurserDatabaseId,
    undefined,
    {
      or: imageNames.map((name) => ({
        property: "Navn",
        title: {
          equals: name,
        },
      })),
    },
  );
  const images = resources.reduce((acc, x) => {
    const name = getTitle(x);
    const url = getFileUrl("Bilde", x);
    if (url === undefined)
      throw new Error(`no image resource for name ${name}`);
    const alt = getText("Alt", x);
    if (alt === undefined) throw new Error(`no alt for name ${name}`);
    acc[name] = { url: rewriteNotionImageUrl(url, x.id), alt };
    return acc;
  }, {} as Record<string, Image>);
  assertContainsItems(imageNames, images);

  return json({ images });
};

// https://remix.run/docs/en/v1/api/conventions#never-reloading-the-root
export const unstable_shouldReload = () => false;

export default function DranksLayout() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="flex flex-col min-h-screen font-satoshi">
      <Header />
      <main className="flex flex-grow">
        <Outlet />
      </main>
      <Footer images={data.images} />
    </div>
  );
}

export const Header = () => {
  const classes = /*tw*/ {
    link: "",
    linkActive: "underline underline-offset-4 text-orange",
    linkButton:
      "uppercase rounded-xl w-40 h-12 text-center flex items-center justify-center transition hover:brightness-90",
  };
  return (
    <header className="h-20 flex  items-center px-4 sm:px-10 md:px-20">
      <nav className="">
        <ul className="flex flex-wrap items-center gap-8">
          <NavLink
            to="./"
            className={({ isActive }) =>
              `${classes.link} ${isActive && classes.linkActive}`
            }
          >
            Dranks
          </NavLink>
          <NavLink to="./sirup">Sirup</NavLink>
          <NavLink to="./super-juice">Super juice</NavLink>
          <NavLink to="./utstyr">Utstyr</NavLink>

          <Link
            to="./quiz"
            className={`${classes.linkButton} text-white bg-orange`}
          >
            Quiz
          </Link>
          <Link
            to="./last-ned-app"
            className={`${classes.linkButton} bg-light-orange`}
          >
            Last ned app
          </Link>
        </ul>
      </nav>
    </header>
  );
};

interface FooterProps {
  images: Record<"sitroner" | "last-ned-fra-app-store", Image>;
}
export const Footer = ({ images }: FooterProps) => {
  return (
    <footer className="bg-orange h-72 flex w-full px-6 sm:px-16 md:px-32">
      <div className="flex-grow" />
      <div className="flex flex-col justify-between">
        <div className="-mt-12">
          <OptimizedImage
            src={images.sitroner.url}
            alt={images.sitroner.alt}
            className="w-36 rotate-6 -top-12"
          />
        </div>
        <a href="#">
          <OptimizedImage
            src={images["last-ned-fra-app-store"].url}
            alt={images["last-ned-fra-app-store"].alt}
          />
        </a>
        <div />
      </div>
    </footer>
  );
};

type OptimizedImageProps = {
  src: string;
} & React.DetailedHTMLProps<
  React.ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>;
const OptimizedImage = ({ src, ...rest }: OptimizedImageProps) => {
  let url = src;

  // Optimize Image
  url = optimizedImageUrl(url);

  // TODO: Screen size optimizations

  return <img src={url} alt={rest.alt} {...rest} />;
};
