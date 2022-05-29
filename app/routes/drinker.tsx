import { LinksFunction, LoaderFunction, json } from "@remix-run/node";
import { NavLink, Outlet, useLoaderData } from "@remix-run/react";
import config from "~/config.server";
import { getDrinker, getTitle, slugify } from "~/notion/notion";
import { DatabasePage } from "~/notion/notion-api.server";
import tailwind from "~/tailwind.css";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: tailwind,
  },
];

type Data = { drinker: DatabasePage[]; debugData?: string };
export const loader: LoaderFunction = async () => {
  const drinker = await getDrinker();

  return json<Data>({ drinker }, { headers: config.cacheControlHeaders });
};

export default function Drinker() {
  const data = useLoaderData<Data>();
  return (
    <div>
      <div className="h-72 w-full bg-teal-100">
        <nav className="max-w-lg flex flex-wrap gap-10 lg:max-w-4xl mx-auto">
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
      <Outlet />
    </div>
  );
}
