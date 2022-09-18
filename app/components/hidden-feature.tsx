import { useCallback, useEffect, useState } from "react";

import { useShortcut } from "./use-shortcut";

interface Props {
  shortcut: string;
  children: React.ReactNode;
}
export const HiddenFeature = ({ shortcut, children }: Props) => {
  const [isActive, setIsActive] = useState(false);
  const activate = useCallback(() => {
    setIsActive(true);
    sessionStorage.setItem(`hidden-feature-${shortcut}`, "true");
  }, []);
  useShortcut(shortcut, activate);

  useEffect(() => {
    if (sessionStorage.getItem(`hidden-feature-${shortcut}`) === "true")
      activate();
  }, []);

  if (isActive) return <>{children}</>;
  else return null;
};
