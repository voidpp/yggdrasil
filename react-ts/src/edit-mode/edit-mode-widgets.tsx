import { ReactNode, useState } from "react";
import { localStorage } from "../local-storage.ts";
import { EditModeContext, useEditMode } from "./edit-mode-context.ts";
import { Box, SxProps, Theme, Tooltip } from "@mui/material";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";

const styles = {
  container: {
    m: 1,
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    borderRadius: 2,
    transition: "opacity 0.5s, color 0.2s",
    "&:hover": {
      opacity: 1,
    },
  },
} satisfies Record<string, SxProps<Theme>>;

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const [enabled, setEnabled] = useState(localStorage.editMode.value);
  return (
    <EditModeContext.Provider
      value={{
        editMode: enabled,
        setEditMode: (value: boolean) => {
          setEnabled(value);
          localStorage.editMode.setValue(value);
        },
      }}
    >
      {children}
    </EditModeContext.Provider>
  );
};

export const EditModeControl = () => {
  const { editMode, setEditMode } = useEditMode();

  return (
    <Tooltip
      title={`Edit mode is ${editMode ? "ON" : "OFF"}. Click here to switch edit mode ${editMode ? "off" : "on"}.`}
      placement="right"
    >
      <Box
        sx={{
          ...styles.container,
          opacity: editMode ? 1 : 0.5,
          color: editMode ? "primary.main" : "default",
        }}
        onClick={() => setEditMode(!editMode)}
      >
        <AppRegistrationIcon fontSize="large" sx={{ filter: "drop-shadow(0px 0px 2px black)" }} />
      </Box>
    </Tooltip>
  );
};
