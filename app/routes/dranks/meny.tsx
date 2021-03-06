import { LinksFunction, json, MetaFunction, LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import Debug from "~/components/debug";
import { maybePrepareDebugData } from "~/components/debug.server";
import config from "~/config.server";
import { getDrinker, getDrinkerDatabase } from "~/notion/notion";
import { SelectColor } from "~/notion/notion.types";
import { prepareFromPage } from "~/packages/notion-drinker/prepare.server";
import {
  Alcohol,
  assertDrinkHeader,
  DrinkHeader,
} from "~/packages/notion-drinker/types";
import tailwind from "~/tailwind.css";
import global from "~/global.css";

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
    drinker: drinker.filter((drink) => drink.alcohol.title === alcohol.title),
  }));

  const debugData = await maybePrepareDebugData(request, drinkerByAlcoholOrder);

  return json(
    { alcoholOrdered, drinker, drinkerByAlcoholOrder, debugData },
    { headers: config.cacheControlHeaders }
  );
};

export const meta: MetaFunction = () => ({
  title: "Dranks - Meny",
});

export default function Drinker() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <div className="flex flex-col gap-20 p-6">
        {data.drinkerByAlcoholOrder.map((it, index) => (
          <DranksAndAlcohol
            key={it.alcohol.title}
            {...it}
            alignment={index % 2 === 0 ? "right" : "left"}
          />
        ))}
      </div>
      <Debug debugData={data.debugData ?? ""} />
    </>
  );
}

interface DranksAndAlcoholProps {
  alcohol: Alcohol;
  drinker: DrinkHeader[];
  alignment: "left" | "right";
}
const DranksAndAlcohol = ({
  alcohol,
  drinker,
  alignment,
}: DranksAndAlcoholProps) => {
  const colorMap: Record<SelectColor, string> = {
    default: "",
    gray: "text-gray-400",
    brown: "text-brown-400",
    orange: "text-orange-400",
    yellow: "text-yellow-400",
    green: "text-green-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
    pink: "text-pink-400",
    red: "text-red-400",
  };

  return (
    <section
      className={`flex flex-row ${
        alignment === "left" ? "flex-row" : "flex-row-reverse"
      }`}
    >
      <div
        className={`w-1/3 flex flex-col justify-center font-avenuex ${
          alignment === "left" ? "text-left" : "text-right"
        }`}
      >
        <span
          className={`text-4xl uppercase font-medium ${
            colorMap[alcohol.color]
          }`}
        >
          {alcohol.title}
        </span>
      </div>

      <div
        className={`w-2/3 flex flex-col justify-center font-chillax ${
          alignment === "left" ? "text-right" : "text-left"
        }`}
      >
        {drinker.map((drink) => (
          <div>
            <span
              className={`${
                drinker.find((x) => x.groups.includes("??????"))?.Tittel ===
                drink.Tittel
                  ? colorMap[drink.alcohol.color]
                  : ""
              }`}
            >
              {drink.Tittel}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};
