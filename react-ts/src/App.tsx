import "./App.css";
import { useWhoAmIQuery } from "./graphql-types-and-hooks.tsx";

export const App = () => {
  const { data } = useWhoAmIQuery();

  if (data?.whoAmI === undefined) return null;

  if (data.whoAmI === null)
    return <a href="/auth/login/google">google login</a>;

  return <a href="/auth/logout">logout</a>;
};
