import { createRemixContext } from "~/packages/remix-sitemap/remix-context.server";
import { typedBoolean } from "~/utils";

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
  loaderPaths?: string[];
}

export interface SitemapHandle<T extends SitemapEntry = SitemapEntry> {
  getSitemapEntries?: (request: Request) => Promise<T[]> | T[];
}

/**
 * Generate sitemap using the build.routes, manifest and custom getSitemapEntries functions
 * To exclude a route, create a getSitemapEntries function returning an empty list
 */
export async function getSitemapEntries<
  Handle extends SitemapHandle<Entry>,
  Entry extends SitemapEntry,
>(request: Request) {
  const remixContext = createRemixContext(request);

  // Execute all custom getSitemapEntries functions to use in the sitemap entry creations below
  const routesWithEntryData = (
    await Promise.all(
      Object.values(remixContext.routes).map(async (route) => {
        // Manual getSitemapEntries
        const handle = route.module.handle as Handle | undefined;
        if (handle?.getSitemapEntries) {
          const entries = await handle.getSitemapEntries(request);
          return entries.map((entry) => ({ route, entry }));
        }
        return { route, entry: undefined };
      }),
    )
  )
    .flat()
    .filter(typedBoolean);

  // Generate the sitemap entries with full absolute paths
  const sitemapEntries = routesWithEntryData.map(({ route, entry }) => {
    let path = entry?.path ?? route.path;
    let parentId = route.parentId;

    // Index routes
    // We use the parents path
    if (path === undefined && route.index) {
      const p = findFirstParentWithPath(remixContext.routes, route.id);
      path = p?.path;
      parentId = p?.parentId;
    }

    // A sitemap entry needs to have a path
    // Even "" is valid, since this is the root route in remix
    if (path === undefined) return undefined;

    // No dynamic routes that does not export a `path`
    // from a handle.getSitemapEntries function
    if (path.includes(":")) return undefined;

    // No resource/api routes without a handle.getSitemapEntries function
    const handle = route.module.handle as Handle | undefined;
    if (!route.module.default && !handle?.getSitemapEntries) return undefined;

    const result: Entry = {
      ...(entry as Entry),
      path: buildFullPath(remixContext.routes, [path], parentId),
      loaderPaths: remixContext.manifest.routes[route.id].hasLoader
        ? [route.id]
        : undefined,
    };
    return result as Entry & { path: string };
  });

  // Filter away invalid entries
  const filteredResult = sitemapEntries.filter(typedBoolean);

  // Merge duplicate entries
  // This happens for layout + index routes
  // NOTE: Layout routes without and index route will show up
  // But remix will also render them if requested
  // So either create the index route, our exclude the layout using getSitemapEntries
  const mergedResult = filteredResult.reduce((acc, entry) => {
    const existingEntry = acc[entry.path!];
    acc[entry.path] = {
      ...existingEntry,
      ...entry,
      loaderPaths:
        existingEntry?.loaderPaths?.concat(entry.loaderPaths ?? []) ??
        entry.loaderPaths,
    };
    return acc;
  }, {} as Partial<Record<string, Entry & { path: string }>>);

  return Object.values(mergedResult).filter(typedBoolean);
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
