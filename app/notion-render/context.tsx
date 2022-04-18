import { createContext, useContext } from "react";
import { DefaultComponents } from ".";
import { Classes } from "./classes";

interface NotionRenderContext {
  components: typeof DefaultComponents;
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
