import type { LinksFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { NavLink, Outlet, useLoaderData } from "@remix-run/react";

import config from "~/config.server";
import { getDrinker, getTitle, slugify } from "~/notion/notion";
import tailwind from "~/tailwind.css";

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
        <div className="max-w-lg lg:max-w-4xl mx-auto pt-10 pb-16">
          <h1 className="text-6xl font-semibold">Drinker</h1>
          <nav className="flex flex-wrap gap-x-10 gap-y-7 mt-8">
            {data.drinker.map((drink) => (
              <NavLink
                key={drink.id}
                to={slugify(getTitle(drink))}
                prefetch="intent"
                className={({ isActive }) =>
                  `p-2 border border-gray-500 bg-white hover:bg-green-600 hover:text-white ${
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
