import ReactDOM from "react-dom/client";
import { App } from "./app.tsx";
import { client } from "./apollo-client.ts";
import { ApolloProvider } from "@apollo/client";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import "./index.css";
import { EditModeProvider } from "./edit-mode/edit-mode-widgets.tsx";

import { CurrentUserProvider } from "./user/widgets.tsx";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
  components: {
    MuiTooltip: {
      defaultProps: {
        arrow: true,
        placement: "top",
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ApolloProvider client={client}>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <EditModeProvider>
        <CurrentUserProvider>
          <App />
        </CurrentUserProvider>
      </EditModeProvider>
    </ThemeProvider>
  </ApolloProvider>,
);
