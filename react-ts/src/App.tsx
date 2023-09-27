import { Login } from "./Login.tsx";
import { Board } from "./Board.tsx";
import { useCurrentUser } from "./currentUser.tsx";

export const App = () => {
  const { currentUser } = useCurrentUser();

  if (currentUser === undefined) return null;

  if (currentUser === null) return <Login />;

  return <Board />;
};
