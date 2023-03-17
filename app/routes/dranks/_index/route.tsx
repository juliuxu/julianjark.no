import { Fragment, useMemo } from "react";
import type {
  HeadersFunction,
  LinksFunction,
  LoaderArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";

import Debug from "~/components/debug";
import { maybePrepareDebugData } from "~/components/debug.server";
import config from "~/config";
import { getDrinker, getDrinkerDatabase, slugify } from "~/notion/notion";
import { prepareFromPage } from "~/packages/notion-drinker/prepare.server";
import type { Alcohol, DrinkHeader } from "~/packages/notion-drinker/types";
import { assertDrinkHeader } from "~/packages/notion-drinker/types";
import satohshiFont from "~/styles/fonts/Satoshi-Variable.woff2";
import { debounce, optimizedImageUrl } from "~/utils";
import { dranksClasses } from "../route";

export const links: LinksFunction = () => [
  {
    rel: "preload",
    href: satohshiFont,
    as: "font",
    type: "font/woff2",
    crossOrigin: "anonymous",
  },
];

export const loader = async ({ request }: LoaderArgs) => {
  const startFetchTime = performance.now();
  const [drinkerDatabase, drinker] = await Promise.all([
    getDrinkerDatabase(),
    getDrinker().then((x) =>
      x.map((drinkPage) => {
        const result = prepareFromPage(drinkPage);
        assertDrinkHeader(result);
        return result;
      }),
    ),
  ] as const);
  const fetchTime = Math.round(performance.now() - startFetchTime);

  // Filtering
  const searchParams = new URL(request.url).searchParams;
  const filterQ = searchParams.get("q");
  const filterAlcohols = searchParams.getAll("alcohols");

  const drinkerFiltered = drinker
    .filter((x) => {
      if (!filterQ) return true;
      const searchTargets = [x.Tittel].map((x) => x.toLowerCase());
      const searchString = filterQ.toLowerCase().trim().replace(/\s+/, " ");
      return searchTargets.some((searchTarget) =>
        searchTarget.includes(searchString),
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
      drinker.some((drink) => drink.alcohol.title === alcohol.title),
    );

  const drinkerByAlcoholOrder = alcoholOrdered.map((alcohol) => ({
    alcohol,
    drinker: drinkerFiltered.filter(
      (drink) => drink.alcohol.title === alcohol.title,
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

      filterQ,
      filterAlcohols,
    },
    {
      headers: {
        ...(filterQ !== null || filterAlcohols.length > 0
          ? config.cacheControlHeadersDynamic(
              (drinkerDatabase as any).last_edited_time,
              60 * 60,
            )
          : config.cacheControlHeaders),
        "Server-Timing": `fetch;dur=${fetchTime}`,
      },
    },
  );
};

export const meta: MetaFunction = () => ({
  title: "Dranks",
});
export let headers: HeadersFunction = ({ loaderHeaders }) => loaderHeaders;

export default function Dranks() {
  const data = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();

  const submitDebounced = useMemo(() => debounce(submit, 200), []);

  const isSubmitting = navigation.state === "submitting";
  const isLoading = navigation.state === "loading";

  const isAlcoholChecked = (alcohol: Alcohol) => {
    if (navigation.formData)
      return navigation.formData.getAll("alcohols").includes(alcohol.title);
    else if (data.filterAlcohols.includes(alcohol.title)) return true;
    else return false;
  };
  return (
    <>
      <div
        className={`flex flex-col gap-14 py-16 ${dranksClasses.layoutPadding} ${dranksClasses.layoutMaxWidth}`}
      >
        {false && (
          <span
            className={`inline-block ${
              isSubmitting || isLoading
                ? "animate-spin opacity-75 transition-opacity delay-700 duration-500"
                : "opacity-0"
            }`}
          >
            🍹
          </span>
        )}
        <Form
          method="get"
          className="flex flex-col gap-7"
          action="/dranks"
          id="dranks-filter-form"
        >
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                aria-hidden="true"
                className="h-5 w-5 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>

            <input
              className="block w-full rounded-lg bg-gray-100 p-3 pl-10"
              type="search"
              placeholder="Søk etter dranks"
              name="q"
              autoFocus
              defaultValue={data.filterQ ?? undefined}
              onChange={(e) =>
                submitDebounced(e.currentTarget.form, { replace: true })
              }
            />
          </div>

          <div className="flex flex-row flex-wrap gap-3 gap-y-3">
            {data.alcoholOrdered.map((alcohol) => (
              <Fragment key={alcohol.title}>
                <label className="contents cursor-pointer">
                  <input
                    type="checkbox"
                    name="alcohols"
                    className="peer sr-only"
                    value={alcohol.title}
                    checked={isAlcoholChecked(alcohol)}
                    onChange={(e) => submit(e.currentTarget.form)}
                  />
                  <span className="rounded-lg border border-dranks-orange px-5 py-[10px] transition peer-checked:bg-dranks-orange peer-checked:text-white peer-focus:ring">
                    {alcohol.title}
                  </span>
                </label>
              </Fragment>
            ))}
          </div>
        </Form>
        <section id="drank-list">
          <ul
            className={`grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 ${
              (isSubmitting || isLoading) &&
              "brightness-75 transition-[filter] delay-500 duration-500"
            }`}
          >
            {data.drinkerByAlcoholOrder
              .flatMap(({ drinker }) => drinker)
              .map((drink) => (
                <li
                  key={drink.Tittel}
                  className="overflow-hidden rounded-md shadow"
                >
                  <DrankCard drank={drink} />
                </li>
              ))}
          </ul>
        </section>
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
    <Link prefetch="intent" to={`${slugify(drank.Tittel)}`}>
      <div className="group relative bg-gradient-to-b from-cyan-400 via-green-200 to-yellow-200 pb-[120%]">
        {/* <img
          className="absolute w-full h-full object-cover blur-xl"
          src={optimizedImageUrl(drank.Illustrasjon, {
            height: 10,
            format: "webp",
          })}
          alt=""
        /> */}
        <img
          className="absolute h-full w-full object-cover transition-all duration-500 ease-in-out group-hover:scale-[1.1]"
          src={optimizedImageUrl(drank.Illustrasjon, { height: 400 })}
          alt=""
        />
        <span
          className="absolute bottom-0 p-4 text-2xl font-semibold text-white drop-shadow-lg"
          style={{ textShadow: "0 0 10px rgb(0 0 0 / 33%)" }}
        >
          {drank.Tittel}
        </span>
      </div>
    </Link>
  );
};
