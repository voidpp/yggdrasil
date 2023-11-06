import { createContext, useContext } from "react";
import { UserInfo } from "../graphql-types-and-hooks.tsx";

type CurrentUserValue = {
  currentUser?: UserInfo | null;
};

export const CurrentUserContext = createContext<CurrentUserValue>({});

export const useCurrentUser = () => useContext(CurrentUserContext);
