import { createContext, useContext } from "react";
import { localStorage } from "../local-storage.ts";

type EditModeValue = {
  editMode: boolean;
  setEditMode: (value: boolean) => void;
};

export const EditModeContext = createContext<EditModeValue>({
  editMode: localStorage.editMode.value,
  setEditMode: () => {},
});

export const useEditMode = () => useContext(EditModeContext);
