import { Login } from "./user/login.tsx";
import { Board } from "./board/board.tsx";
import { useCurrentUser } from "./user/current-user-context.ts";

export const App = () => {
  const { currentUser } = useCurrentUser();

  if (currentUser === undefined) return null;

  if (currentUser === null) return <Login />;

  return <Board />;
};
