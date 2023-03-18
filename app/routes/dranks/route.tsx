import type { HeadersFunction, LinksFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import type { ShouldRevalidateFunction } from "@remix-run/react";
import { Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";

import { OptimizedImage } from "~/components/optimized-image";
import config from "~/config";
import type { ImageResource } from "~/notion/notion";
import { fetchDranksImageResources } from "~/notion/notion";
import fontComico from "~/styles/font-comico.css";
import fontSatoshi from "~/styles/font-satoshi.css";
import tailwind from "~/styles/tailwind.css";
import { Footer } from "./footer";
import { Header } from "./header";

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

export const loader = async () => {
  const images = await fetchDranksImageResources([
    "sitroner",
    "last-ned-fra-app-store",
  ]);

  return json({ images }, { headers: config.cacheControlHeaders });
};
export const shouldRevalidate: ShouldRevalidateFunction = () => false;
export const headers: HeadersFunction = ({ loaderHeaders }) => loaderHeaders;

export default function Component() {
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
