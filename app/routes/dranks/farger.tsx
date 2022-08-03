import {
  LinksFunction,
  json,
  MetaFunction,
  LoaderArgs,
  HeadersFunction,
} from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useSearchParams,
  useSubmit,
  useTransition,
} from "@remix-run/react";
import Debug from "~/components/debug";
import { maybePrepareDebugData } from "~/components/debug.server";
import config from "~/config.server";
import { getDrinker, getDrinkerDatabase } from "~/notion/notion";
import { prepareFromPage } from "~/packages/notion-drinker/prepare.server";
import {
  Alcohol,
  assertDrinkHeader,
  DrinkHeader,
} from "~/packages/notion-drinker/types";
import tailwind from "~/tailwind.css";
import global from "~/global.css";
import { debounce, optimizedImageUrl } from "~/utils";
import React, { Fragment, useCallback } from "react";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: tailwind,
  },
  {
    rel: "stylesheet",
    href: global,
  },
];

export const loader = async ({ request }: LoaderArgs) => {
  const [drinkerDatabase, drinker] = await Promise.all([
    getDrinkerDatabase(),
    getDrinker().then((x) =>
      x.map((drinkPage) => {
        const result = prepareFromPage(drinkPage);
        assertDrinkHeader(result);
        return result;
      })
    ),
  ] as const);

  // Filtering
  const searchParams = new URL(request.url).searchParams;
  const filterSearch = searchParams.get("search");
  const filterAlcohols = searchParams.getAll("alcohols");

  const drinkerFiltered = drinker
    .filter((x) => {
      if (!filterSearch) return true;
      const searchTargets = [x.Tittel].map((x) => x.toLowerCase());
      const searchString = filterSearch
        .toLowerCase()
        .trim()
        .replace(/\s+/, " ");
      return searchTargets.some((searchTarget) =>
        searchTarget.includes(searchString)
      );
    })
    .filter((x) => {
      if (filterAlcohols.length === 0) return true;
      return filterAlcohols.includes(x.Alkohol);
    });

  // Ordering
  if (drinkerDatabase.properties["Alkohol"].type !== "select")
    throw new Error("Database mangler Alkohol");
  const alcoholOrdered = drinkerDatabase.properties["Alkohol"].select.options
    .map((x) => {
      if (!x.color) throw new Error(`color is missing from ${x.name}`);
      return { title: x.name, color: x.color };
    })
    .filter((alcohol) =>
      drinker.some((drink) => drink.alcohol.title === alcohol.title)
    );

  const drinkerByAlcoholOrder = alcoholOrdered.map((alcohol) => ({
    alcohol,
    drinker: drinkerFiltered.filter(
      (drink) => drink.alcohol.title === alcohol.title
    ),
  }));

  // Result
  const debugData = await maybePrepareDebugData(request, drinkerByAlcoholOrder);
  return json(
    {
      alcoholOrdered,
      drinker: drinkerFiltered,
      drinkerByAlcoholOrder,
      debugData,

      filterSearch,
      filterAlcohols,
    },
    { headers: config.cacheControlHeaders }
  );
};

export const meta: MetaFunction = () => ({
  title: "Dranks - Farger",
});

export let headers: HeadersFunction = ({ loaderHeaders }) => loaderHeaders;

export default function Drinker() {
  const data = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const transition = useTransition();

  const submitDebounced = useCallback(debounce(submit, 200), []);

  const isSubmitting = transition.state === "submitting";
  const isAlcoholChecked = (alcohol: Alcohol) => {
    if (transition.submission?.formData)
      return transition.submission?.formData
        .getAll("alcohols")
        .includes(alcohol.title);
    else if (data.filterAlcohols.includes(alcohol.title)) return true;
    else return false;
  };

  return (
    <>
      <div className="flex flex-col gap-10 p-6 bg-gray-50 h-screen">
        <h1 className="text-4xl uppercase">
          Dranks{" "}
          <span
            className={`inline-block ${
              isSubmitting
                ? "transition-opacity duration-500 delay-700 opacity-75 animate-spin"
                : "opacity-0"
            }`}
          >
            🍹
          </span>
        </h1>
        <Form method="get" className="flex flex-col gap-3" reloadDocument>
          <input
            className="w-full bg-gray-200 rounded px-3 py-2"
            type="search"
            placeholder="Søk etter dranks"
            name="search"
            autoFocus
            defaultValue={data.filterSearch ?? ""}
            onChange={(e) =>
              submitDebounced(e.currentTarget.form, { replace: true })
            }
          />
          <div className="flex flex-row gap-3 gap-y-3 flex-wrap">
            {data.alcoholOrdered.map((alcohol) => (
              <Fragment key={alcohol.title}>
                <label className="cursor-pointer contents">
                  <input
                    type="checkbox"
                    name="alcohols"
                    className="sr-only peer"
                    value={alcohol.title}
                    checked={isAlcoholChecked(alcohol)}
                    onChange={(e) => submit(e.currentTarget.form)}
                  />
                  <span className="rounded px-3 py-2 bg-gray-200 peer-checked:bg-teal-100 peer-focus:ring-teal-200 peer-focus:ring-4">
                    {alcohol.title}
                  </span>
                </label>
              </Fragment>
            ))}
          </div>
        </Form>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-5">
          {data.drinkerByAlcoholOrder
            .flatMap(({ drinker }) => drinker)
            .map((drink) => (
              <DrankCard key={drink.Tittel} drank={drink} />
            ))}
        </div>
      </div>
      <Debug debugData={data.debugData ?? ""} />
    </>
  );
}

interface DrankCardProps {
  drank: DrinkHeader;
}
const DrankCard = ({ drank }: DrankCardProps) => {
  return (
    <a href="#" className="overflow-hidden rounded-md shadow">
      <div className="relative pb-[120%] group bg-gradient-to-b from-cyan-400 via-green-200 to-yellow-200">
        {/* <img
          className="absolute w-full h-full object-cover blur-xl"
          src={optimizedImageUrl(drank.Illustrasjon, {
            height: 10,
            format: "webp",
          })}
          alt=""
        /> */}
        <img
          className="absolute w-full h-full object-cover group-hover:scale-[1.1] transition-all ease-in-out duration-500"
          src={optimizedImageUrl(drank.Illustrasjon, { height: 400 })}
          alt=""
        />
        <span
          className="absolute bottom-0 p-4 text-2xl text-white font-semibold drop-shadow-lg"
          style={{ textShadow: "0 0 10px rgb(0 0 0 / 33%)" }}
        >
          {drank.Tittel}
        </span>
      </div>
    </a>
  );
};
