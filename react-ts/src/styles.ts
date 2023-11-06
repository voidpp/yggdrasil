import { SxProps, Theme } from "@mui/material";

export const commonStyles = {
  glass: {
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 0 10px 5px rgba(0,0,0,.2)",
    border: "1px solid rgba(255,255,255,0.15)",
  },
  buttonOnGlass: {
    textShadow: "1px 1px 2px black",
  },
  editModePanel: {
    background: (theme) => theme.palette.grey["800"],
  },
} satisfies Record<string, SxProps<Theme>>;
