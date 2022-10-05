import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";

import { createRemixContext } from "~/remix-context.server";
import { typedBoolean } from "~/utils";

const sitemapWhitelist = [/^\/$/, /^\/today-i-learned/, /^\/dranks(?!\/meny$)/];

export interface SitemapEntry {
  path?: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: 0.0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0;

  title?: string;
  loaderPaths?: string[];
}

export interface JulianHandle {
  getSitemapEntries?: (
    request: Request,
  ) => Promise<SitemapEntry[]> | SitemapEntry[];
}

export interface Page {
  path: string;
  codePath: string | string[];
}

const buildFullPath = (
  routes: ReturnType<typeof createRemixContext>["routes"],
  paths: Array<string | undefined>,
  parentId?: string,
): string => {
  const parentRoute = parentId && routes[parentId];
  if (!parentRoute) return "/" + paths.filter(Boolean).join("/");
  return buildFullPath(
    routes,
    [parentRoute.path, ...paths],
    parentRoute.parentId ?? "",
  );
};
const findFirstParentWithPath = (
  routes: ReturnType<typeof createRemixContext>["routes"],
  id?: string,
): ReturnType<typeof createRemixContext>["routes"][number] | undefined => {
  const route = id && routes[id];
  if (!route) return undefined;
  else if (route.path !== undefined) return route;
  else return findFirstParentWithPath(routes, route.parentId);
};

export const loader = async ({ request }: LoaderArgs) => {
  const remixContext = createRemixContext(request);

  const routesWithEntryData = (
    await Promise.all(
      Object.values(remixContext.routes).map(async (route) => {
        // Manual getSitemapEntries
        const handle = route.module.handle as JulianHandle | undefined;
        if (handle?.getSitemapEntries) {
          const entries = await handle.getSitemapEntries(request);
          return entries.map((entry) => ({ route, entry }));
        }
        return { route };
      }),
    )
  ).flat();

  const resultPromises = Object.values(remixContext.routes).map(
    async (route) => {
      // Manual getSitemapEntries
      const handle = route.module.handle as JulianHandle | undefined;
      if (handle?.getSitemapEntries) {
        const entries = await handle.getSitemapEntries(request);
        return entries.map((entry): SitemapEntry => {
          const path = entry.path ?? route.path;
          return {
            ...entry,
            path: buildFullPath(remixContext.routes, [path], route.parentId),
            loaderPaths: remixContext.manifest.routes[route.id].hasLoader
              ? [route.id]
              : undefined,
          };
        });
      }

      let { path, parentId } = route;

      // Index routes
      // We use the parents path
      if (path === undefined && route.index) {
        const p = findFirstParentWithPath(remixContext.routes, route.id);
        path = p?.path;
        parentId = p?.parentId;
      }

      if (path === undefined) return undefined;

      // No dynamic routes that does not export a `path`
      // from a handle.getSitemapEntries function
      if (path.includes(":")) return undefined;

      // No resource/api routes without a handle.getSitemapEntries function
      if (!route.module.default && !handle?.getSitemapEntries) return undefined;

      const result: SitemapEntry = {
        path: buildFullPath(remixContext.routes, [path], parentId),
        loaderPaths: remixContext.manifest.routes[route.id].hasLoader
          ? [route.id]
          : undefined,
      };
      return result;
    },
  );

  // Filter
  const filteredResult = (await Promise.all(resultPromises))
    .flat()
    .filter(typedBoolean)
    .filter((page) => sitemapWhitelist.some((r) => r.test(page?.path!)));

  // Merge
  const mergedResult = filteredResult.reduce((acc, entry) => {
    const existingEntry = acc[entry.path!];
    acc[entry.path!] = {
      ...existingEntry,
      ...entry,
      loaderPaths:
        existingEntry?.loaderPaths?.concat(entry.loaderPaths ?? []) ??
        entry.loaderPaths,
    };
    return acc;
  }, {} as Partial<Record<string, SitemapEntry>>);

  return json(Object.values(mergedResult));
};
