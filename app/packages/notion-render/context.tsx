import { createContext, useContext } from "react";
import type { Components } from "./components";
import type { Classes } from "./classes";

interface NotionRenderContext {
  components: Components;
  classes: Classes;
}
export const Context = createContext<NotionRenderContext | undefined>(
  undefined
);

export const useNotionRenderContext = () => {
  const context = useContext(Context);
  if (context === undefined)
    throw new Error("useNotionRenderContext called without a Provider");
  return context;
};

export default Context;
