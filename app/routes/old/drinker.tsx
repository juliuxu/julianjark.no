import type { LinksFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { NavLink, Outlet, useLoaderData } from "@remix-run/react";

import config from "~/config";
import { getDrinker, getTitle, slugify } from "~/notion/notion";
import tailwind from "~/styles/tailwind.css";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: tailwind,
  },
];

export const loader = async () => {
  const drinker = await getDrinker();

  return json({ drinker }, { headers: config.cacheControlHeaders });
};

export default function Drinker() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <div className="min-h-72 w-full bg-green-100">
        <div className="mx-auto max-w-lg pt-10 pb-16 lg:max-w-4xl">
          <h1 className="text-6xl font-semibold">Drinker</h1>
          <nav className="mt-8 flex flex-wrap gap-x-10 gap-y-7">
            {data.drinker.map((drink) => (
              <NavLink
                key={drink.id}
                to={slugify(getTitle(drink))}
                prefetch="intent"
                className={({ isActive }) =>
                  `border border-gray-500 bg-white p-2 hover:bg-green-600 hover:text-white ${
                    isActive ? "bg-green-600 text-white" : ""
                  }`
                }
              >
                {getTitle(drink)}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <Outlet />
    </div>
  );
}
