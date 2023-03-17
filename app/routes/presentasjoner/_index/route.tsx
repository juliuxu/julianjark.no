import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { getPresentasjoner, getTitle, slugify } from "~/notion/notion";

export async function loader() {
  const presentasjoner = await (
    await getPresentasjoner()
  ).map((presentasjon) => ({
    title: getTitle(presentasjon),
    slug: slugify(getTitle(presentasjon)),
  }));

  return json({ presentasjoner });
}

export default function Component() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <ul>
        {data.presentasjoner.map((presentasjon) => (
          <li key={presentasjon.slug}>
            <a href={`/presentasjoner/${presentasjon.slug}`}>
              {presentasjon.title}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
