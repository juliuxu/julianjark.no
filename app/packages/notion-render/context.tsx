import { createContext, useContext } from "react";

import type { Classes } from "./classes";
import type { Components } from "./components";

interface NotionRenderContext {
  components: Components;
  classes: Classes;
}
export const Context = createContext<NotionRenderContext | undefined>(
  undefined,
);

export const useNotionRenderContext = () => {
  const context = useContext(Context);
  if (context === undefined)
    throw new Error("useNotionRenderContext called without a Provider");
  return context;
};

export default Context;
