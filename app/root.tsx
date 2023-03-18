import { useEffect } from "react";
import type { LinksFunction } from "@remix-run/node";
import {
  isRouteErrorResponse,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useRouteError,
} from "@remix-run/react";

export const links: LinksFunction = () => [
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  {
    rel: "icon",
    type: "image/png",
    sizes: "32x32",
    href: "/favicon-32x32.png",
  },
  {
    rel: "icon",
    type: "image/png",
    sizes: "16x16",
    href: "/favicon-16x16.png",
  },
  { rel: "manifest", href: "/site.webmanifest" },
];

export default function App() {
  return (
    <html lang="no" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="flex h-full flex-col">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />

        {/* Analytics */}
        {process.env.NODE_ENV === "production" && !process.env.CI && (
          <>
            {/* Umami */}
            <script
              async
              defer
              data-website-id="fcf30463-79c0-4049-81a1-df59b1dde5f3"
              src="https://umami.julianjark.no/umami.js"
            />

            {/* Matomo */}
            <Matomo />
          </>
        )}
      </body>
    </html>
  );
}

function Matomo() {
  const location = useLocation();
  useEffect(() => {
    // Initial render
    if (!(window as any)._paq) {
      const _paq = ((window as any)._paq ??= []);
      _paq.push(["trackPageView"]);
      _paq.push(["enableLinkTracking"]);
      _paq.push([
        "setTrackerUrl",
        "https://analytics.julianjark.no/matomo.php",
      ]);
      _paq.push(["setSiteId", "1"]);
    } else {
      // Subsequent page loads
      (window as any)._paq?.push([
        "setCustomUrl",
        location.pathname + location.search,
      ]);
      (window as any)._paq?.push(["setDocumentTitle", document.title]);
      (window as any)._paq?.push(["trackPageView"]);
    }
  }, [location]);

  return <script async defer src="https://analytics.julianjark.no/matomo.js" />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <p>
        {error.status} {error.data}
      </p>
    );
  }

  return (
    <p>
      Rendering error
      <pre>{JSON.stringify(error, null, 2)}</pre>
    </p>
  );
}
