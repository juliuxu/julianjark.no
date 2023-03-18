import { Link, NavLink } from "@remix-run/react";

import { dranksClasses } from "./route";

export const Header = () => {
  const classes = /*tw*/ {
    link: "text-xl",
    linkActive: "underline underline-offset-4 text-dranks-orange",
    linkButton:
      "text-base uppercase rounded-xl w-40 h-12 text-center flex items-center justify-center transition hover:brightness-90",
  };
  return (
    <header>
      <nav className={`${dranksClasses.layoutPadding}`}>
        <ul className="flex min-h-[5rem] flex-wrap items-center gap-y-4 gap-x-8 py-4">
          <NavLink
            prefetch="intent"
            to="/dranks"
            end
            className={({ isActive }) =>
              `${classes.link} ${isActive && classes.linkActive}`
            }
          >
            Dranks
          </NavLink>
          <NavLink
            prefetch="intent"
            to="/dranks/sirup"
            className={({ isActive }) =>
              `${classes.link} ${isActive && classes.linkActive}`
            }
          >
            Sirup
          </NavLink>
          <NavLink
            prefetch="intent"
            to="/dranks/super-juice"
            className={({ isActive }) =>
              `${classes.link} ${isActive && classes.linkActive}`
            }
          >
            Super juice
          </NavLink>
          <NavLink
            prefetch="intent"
            to="/dranks/utstyr"
            className={({ isActive }) =>
              `${classes.link} ${isActive && classes.linkActive}`
            }
          >
            Utstyr
          </NavLink>

          <div className="h-0 flex-grow-0 basis-full md:flex-grow md:basis-auto" />
          <div className="flex w-full flex-col gap-y-4 gap-x-5 md:w-auto md:flex-row lg:gap-x-8">
            <Link
              prefetch="intent"
              to="/dranks/quiz"
              className={`${classes.linkButton} w-full bg-dranks-orange text-white md:w-40`}
            >
              Quiz
            </Link>
            <Link
              prefetch="intent"
              to="/dranks/last-ned-app"
              className={`${classes.linkButton} w-full bg-light-orange md:w-40`}
            >
              Last ned app
            </Link>
          </div>
        </ul>
      </nav>
    </header>
  );
};
