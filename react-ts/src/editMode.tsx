import { createContext, ReactNode, useContext, useState } from "react";

type EditModeValue = {
  editMode: boolean;
  setEditMode: (value: boolean) => void;
};

export const EditModeContext = createContext<EditModeValue>({ editMode: false, setEditMode: () => {} });

export const EditModeProvider = ({ children }: { children: ReactNode }) => {
  const [enabled, setEnabled] = useState(false);
  return (
    <EditModeContext.Provider value={{ editMode: enabled, setEditMode: setEnabled }}>
      {children}
    </EditModeContext.Provider>
  );
};

export const useEditMode = () => useContext(EditModeContext);
