import type { LinksFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";

import { OptimizedImage } from "~/components/optimized-image";
import type { ImageResource } from "~/notion/notion";
import { fetchDranksImageResources } from "~/notion/notion";
import fontComico from "~/styles/font-comico.css";
import fontSatoshi from "~/styles/font-satoshi.css";
import tailwind from "~/tailwind.css";

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
  // "theme-color": "#F9A613",
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

export const dranksClasses = /*tw*/ {
  layoutPadding: "px-3 sm:px-6 md:px-12 lg:px-24 xl:px-36 2xl:px-48",
  layoutMaxWidth: "", // "mx-auto md:max-w-5xl lg:max-w-7xl",
} as const;

export const Header = () => {
  const classes = /*tw*/ {
    link: "text-xl",
    linkActive: "underline underline-offset-4 text-orange",
    linkButton:
      "text-base uppercase rounded-xl w-40 h-12 text-center flex items-center justify-center transition hover:brightness-90",
  };
  return (
    <header>
      <nav className={`${dranksClasses.layoutPadding}`}>
        <ul className="min-h-[5rem] py-4 flex flex-wrap items-center gap-y-4 gap-x-8">
          <NavLink
            to="/dranks"
            end
            className={({ isActive }) =>
              `${classes.link} ${isActive && classes.linkActive}`
            }
          >
            Dranks
          </NavLink>
          <NavLink
            to="/dranks/sirup"
            className={({ isActive }) =>
              `${classes.link} ${isActive && classes.linkActive}`
            }
          >
            Sirup
          </NavLink>
          <NavLink
            to="/dranks/super-juice"
            className={({ isActive }) =>
              `${classes.link} ${isActive && classes.linkActive}`
            }
          >
            Super juice
          </NavLink>
          <NavLink
            to="/dranks/utstyr"
            className={({ isActive }) =>
              `${classes.link} ${isActive && classes.linkActive}`
            }
          >
            Utstyr
          </NavLink>

          <div className="flex-grow-0 md:flex-grow h-0 basis-full md:basis-auto" />
          <div className="flex flex-col md:flex-row w-full md:w-auto gap-y-4 gap-x-5 lg:gap-x-8">
            <Link
              to="/dranks/quiz"
              className={`${classes.linkButton} text-white bg-orange w-full md:w-40`}
            >
              Quiz
            </Link>
            <Link
              to="/dranks/last-ned-app"
              className={`${classes.linkButton} bg-light-orange w-full md:w-40`}
            >
              Last ned app
            </Link>
          </div>
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
    <footer
      className={`bg-orange h-72 flex w-full mt-14 ${dranksClasses.layoutPadding}`}
    >
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
