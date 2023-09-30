import { createContext, ReactNode, useContext, useState } from "react";
import { localStorage } from "./localStorage.ts";

type EditModeValue = {
  editMode: boolean;
  setEditMode: (value: boolean) => void;
};

export const EditModeContext = createContext<EditModeValue>({
  editMode: localStorage.editMode.value,
  setEditMode: () => {},
});

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

export const useEditMode = () => useContext(EditModeContext);
