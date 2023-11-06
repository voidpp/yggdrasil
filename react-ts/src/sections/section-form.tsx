import { useSaveSectionMutation } from "../graphql-types-and-hooks.tsx";
import { Controller, useForm } from "react-hook-form";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useState } from "react";
import { commonStyles } from "../styles.ts";

type SectionFormData = {
  id?: number;
  name: string;
  rank: number;
};

export const SectionFormDialog = ({
  open,
  close,
  sectionData,
  onSave,
}: {
  open: boolean;
  close: () => void;
  sectionData: SectionFormData;
  onSave: () => void;
}) => {
  const [saveSection] = useSaveSectionMutation();
  const { control, handleSubmit, reset } = useForm<SectionFormData>({ defaultValues: sectionData });

  const onSubmit = async (data: SectionFormData) => {
    await saveSection({ variables: { section: data } });
    if (!sectionData.id) reset();
    close();
    onSave();
  };

  return (
    <Dialog open={open}>
      <DialogTitle>Add section</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Name"
                size="small"
                sx={{ mt: 2 }}
                helperText="Leave empty to hide section header"
              />
            )}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSubmit(onSubmit)}>Save</Button>
        <Button onClick={close}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export const AddSectionFormButton = ({ onSave, nextRank }: { onSave: () => void; nextRank: number }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} sx={commonStyles.buttonOnGlass}>
        add section
      </Button>
      <SectionFormDialog
        open={open}
        close={() => setOpen(false)}
        sectionData={{ name: "", rank: nextRank }}
        onSave={onSave}
      />
    </>
  );
};
