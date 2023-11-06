import { ReactNode } from "react";
import { useWhoAmIQuery } from "../graphql-types-and-hooks.tsx";
import { CurrentUserContext } from "./current-user-context.ts";

export const CurrentUserProvider = ({ children }: { children: ReactNode }) => {
  const { data } = useWhoAmIQuery();

  return <CurrentUserContext.Provider value={{ currentUser: data?.whoAmI }}>{children}</CurrentUserContext.Provider>;
};
