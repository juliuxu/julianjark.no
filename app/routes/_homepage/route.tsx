import type {
  LinksFunction,
  LoaderArgs,
  V2_HtmlMetaDescriptor,
  V2_MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import type { ShouldRevalidateFunction } from "@remix-run/react";
import { Outlet, useLoaderData } from "@remix-run/react";

import { getNotionDrivenPages, getTitle, slugify } from "~/notion/notion";
import designTokens from "~/styles/design-tokens.json";
import layoutCss from "~/styles/layout.css";
import shikiCodeCss from "~/styles/shiki-code.css";
import tailwind from "~/styles/tailwind.css";
import { isDevMode } from "~/utils";
import type { MenuItem } from "./header";
import { Header } from "./header";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: tailwind,
  },
  {
    rel: "stylesheet",
    href: shikiCodeCss,
  },
  {
    rel: "stylesheet",
    href: layoutCss,
  },
];

export const sharedMeta: V2_HtmlMetaDescriptor[] = [
  {
    name: "theme-color",
    content: designTokens.colors.dark,
  },
];
export const meta: V2_MetaFunction = () => sharedMeta;

const staticMenuItemStrings = ["Dranks", "🚧 Blogg", "Today I Learned"];
export const loader = async ({ request }: LoaderArgs) => {
  const staticMenuItems = staticMenuItemStrings
    .filter((x) => isDevMode(request) || !x.includes("🚧"))
    .map((x) => x.replace("🚧", "").trim())
    .map((x): MenuItem => ({ title: x, to: slugify(x) }));

  const dynamicMenuItems = (await getNotionDrivenPages(request)).map(
    (x): MenuItem => ({ title: getTitle(x), to: slugify(getTitle(x)) }),
  );

  const menuItems = [...dynamicMenuItems, ...staticMenuItems];

  return json({ menuItems });
};
export const shouldRevalidate: ShouldRevalidateFunction = () => false;

export default function Component() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <div className="h-full bg-[#11191f]">
        <header className="mx-[5vw] h-20">
          <div className="mx-auto h-full">
            <Header menuItems={data.menuItems} />
          </div>
        </header>
        <main className="pt-10">
          <Outlet />
        </main>
        <footer className="h-10"></footer>
      </div>
    </>
  );
}
