import type { LinksFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";

import { OptimizedImage } from "~/components/optimized-image";
import config from "~/config";
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

  return json({ images }, { headers: config.cacheControlHeaders });
};

// https://remix.run/docs/en/v1/api/conventions#never-reloading-the-root
export const unstable_shouldReload = () => false;

export default function DranksLayout() {
  const data = useLoaderData<typeof loader>();
  return (
    <div className="flex min-h-screen flex-col font-satoshi">
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
    linkActive: "underline underline-offset-4 text-dranks-orange",
    linkButton:
      "text-base uppercase rounded-xl w-40 h-12 text-center flex items-center justify-center transition hover:brightness-90",
  };
  return (
    <header>
      <nav className={`${dranksClasses.layoutPadding}`}>
        <ul className="flex min-h-[5rem] flex-wrap items-center gap-y-4 gap-x-8 py-4">
          <NavLink
            prefetch="intent"
            to="/dranks"
            end
            className={({ isActive }) =>
              `${classes.link} ${isActive && classes.linkActive}`
            }
          >
            Dranks
          </NavLink>
          <NavLink
            prefetch="intent"
            to="/dranks/sirup"
            className={({ isActive }) =>
              `${classes.link} ${isActive && classes.linkActive}`
            }
          >
            Sirup
          </NavLink>
          <NavLink
            prefetch="intent"
            to="/dranks/super-juice"
            className={({ isActive }) =>
              `${classes.link} ${isActive && classes.linkActive}`
            }
          >
            Super juice
          </NavLink>
          <NavLink
            prefetch="intent"
            to="/dranks/utstyr"
            className={({ isActive }) =>
              `${classes.link} ${isActive && classes.linkActive}`
            }
          >
            Utstyr
          </NavLink>

          <div className="h-0 flex-grow-0 basis-full md:flex-grow md:basis-auto" />
          <div className="flex w-full flex-col gap-y-4 gap-x-5 md:w-auto md:flex-row lg:gap-x-8">
            <Link
              prefetch="intent"
              to="/dranks/quiz"
              className={`${classes.linkButton} w-full bg-dranks-orange text-white md:w-40`}
            >
              Quiz
            </Link>
            <Link
              prefetch="intent"
              to="/dranks/last-ned-app"
              className={`${classes.linkButton} w-full bg-light-orange md:w-40`}
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
        <a href="#" className="flex justify-center">
          <OptimizedImage {...images["last-ned-fra-app-store"]} />
        </a>
        <div />
      </div>
    </footer>
  );
};
