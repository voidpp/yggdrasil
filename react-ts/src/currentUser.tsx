import { createContext, ReactNode, useContext } from "react";
import { UserInfo, useWhoAmIQuery } from "./graphql-types-and-hooks.tsx";

type CurrentUserValue = {
  currentUser?: UserInfo | null;
};

export const CurrentUserContext = createContext<CurrentUserValue>({});

export const CurrentUserProvider = ({ children }: { children: ReactNode }) => {
  const { data } = useWhoAmIQuery();

  return <CurrentUserContext.Provider value={{ currentUser: data?.whoAmI }}>{children}</CurrentUserContext.Provider>;
};

export const useCurrentUser = () => useContext(CurrentUserContext);
