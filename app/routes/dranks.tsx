import type { LinksFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";

import { OptimizedImage } from "~/components/optimized-image";
import type { ImageResource } from "~/notion/notion";
import { fetchDranksImageResources } from "~/notion/notion";
import fontComico from "~/styles/font-comico.css";
import fontSatoshi from "~/styles/font-satoshi.css";
import tailwind from "~/tailwind.css";
import { optimizedImageUrl } from "~/utils";

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

export const loader = async () => {
  const images = await fetchDranksImageResources([
    "sitroner",
    "last-ned-fra-app-store",
  ]);

  return json({ images });
};

// https://remix.run/docs/en/v1/api/conventions#never-reloading-the-root
export const unstable_shouldReload = () => false;

export default function DranksLayout() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="flex flex-col min-h-screen font-satoshi">
      <Header />
      <main className="flex-grow">
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
  images: Record<"sitroner" | "last-ned-fra-app-store", ImageResource>;
}
export const Footer = ({ images }: FooterProps) => {
  return (
    <footer className="bg-orange h-72 flex w-full px-6 sm:px-16 md:px-32 mt-14">
      <div className="flex-grow" />
      <div className="flex flex-col justify-between">
        <div className="-mt-12">
          <OptimizedImage
            {...images["sitroner"]}
            className="w-36 rotate-6 -top-12"
          />
        </div>
        <a href="#" className="flex justify-center">
          <OptimizedImage {...images["last-ned-fra-app-store"]} />
        </a>
        <div />
      </div>
    </footer>
  );
};
