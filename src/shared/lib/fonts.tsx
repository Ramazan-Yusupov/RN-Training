import { createContext, type ReactNode, useContext } from "react";

const AppFontContext = createContext(false);

export function AppFontProvider({ loaded, children }: { loaded: boolean; children: ReactNode }) {
  return <AppFontContext.Provider value={loaded}>{children}</AppFontContext.Provider>;
}

export function useAppFontLoaded() {
  return useContext(AppFontContext);
}
