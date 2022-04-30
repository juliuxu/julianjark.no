import { LinksFunction } from "@remix-run/node";
import picoCss from "@picocss/pico/css/pico.min.css";
import { optimizedImageUrl } from "~/common";

export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: picoCss,
  },
];

export default function CodeTest() {
  return (
    <main className="container">
      <h1>Image test</h1>
      <div className="grid">
        <div>
          <h2>Through image optimzation</h2>
          <img
            src={optimizedImageUrl(
              "https://images.unsplash.com/photo-1616530940355-351fabd9524b?ixlib=rb-1.2.1&q=85&fm=jpg&crop=entropy&cs=srgb"
            )}
          />
        </div>
        <div>
          <h2>Original</h2>
          <img src="https://images.unsplash.com/photo-1616530940355-351fabd9524b?ixlib=rb-1.2.1&q=85&fm=jpg&crop=entropy&cs=srgb" />
        </div>
      </div>
    </main>
  );
}
