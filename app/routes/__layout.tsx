import {
  json,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { commonLinks } from "~/common";
import TopLevelMenu, {
  loader as topLevelMenuLoader,
} from "~/components/topLevelMenu";

export const loader: LoaderFunction = async () => {
  return json({
    ...(await topLevelMenuLoader()),
  });
};

export const links: LinksFunction = () => [...commonLinks()];
export const meta: MetaFunction = () => ({
  title: "Julian Jark",
});

export default function Layout() {
  const data = useLoaderData();
  return (
    <>
      <header className="container">
        <TopLevelMenu sitemapTree={data.sitemapTree} />
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
