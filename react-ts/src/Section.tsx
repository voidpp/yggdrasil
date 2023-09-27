import { useState } from "react";
import { Link, Section, useDeleteSectionMutation, useSaveSectionMutation } from "./graphql-types-and-hooks.tsx";
import { Controller, useForm } from "react-hook-form";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  SxProps,
  TextField,
  Typography,
} from "@mui/material";
import { AddLinkFormButton, LinkBox } from "./LinkBox.tsx";
import { useEditMode } from "./editMode.tsx";

const styles = {
  sectionContainer: {
    borderRadius: 4,
  },
  panel: {
    backgroundColor: "rgba(0,0,0,0.5)",
    p: 2,
    borderRadius: 2,
    backdropFilter: "blur(5px)",
    width: "100%",
  },
} satisfies Record<string, SxProps>;

type SectionFormData = {
  id?: number;
  name: string;
  rank: number;
};

const SectionFormDialog = ({
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
            render={({ field }) => <TextField {...field} label="Name" size="small" sx={{ mt: 2 }} required />}
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
      <Button onClick={() => setOpen(true)}>add section</Button>
      <SectionFormDialog
        open={open}
        close={() => setOpen(false)}
        sectionData={{ name: "", rank: nextRank }}
        onSave={onSave}
      />
    </>
  );
};

const removeTypename = <T extends { __typename?: string }>(object: T): Omit<T, "__typename"> => {
  const cloned = { ...object };
  if (cloned.__typename) delete cloned.__typename;
  return cloned;
};

const SectionPanel = ({
  section,
  links,
  refetchLinks,
  refetchSections,
}: {
  section: Section;
  links: Link[];
  refetchLinks: () => void;
  refetchSections: () => void;
}) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [deleteSection] = useDeleteSectionMutation();
  const { editMode } = useEditMode();

  return (
    <Box sx={styles.panel}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h6">{section.name}</Typography>
        {editMode && (
          <Box>
            <Button size="small" onClick={() => setOpenEditDialog(true)}>
              edit
            </Button>
            <Button
              size="small"
              onClick={async () => {
                await deleteSection({ variables: { id: section.id } });
                refetchSections();
              }}
            >
              delete
            </Button>
          </Box>
        )}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {links.map((link) => (
          <LinkBox link={link} key={link.id} refetchLinks={refetchLinks} />
        ))}
        {editMode && (
          <AddLinkFormButton
            sx={{ ml: 1 }}
            onSave={refetchLinks}
            nextRank={Math.max(...links.map((link) => link.rank), 0) + 1}
            sectionId={section.id}
          />
        )}
      </Box>
      <SectionFormDialog
        open={openEditDialog}
        close={() => setOpenEditDialog(false)}
        sectionData={removeTypename(section)}
        onSave={refetchLinks}
      />
    </Box>
  );
};

export const SectionList = ({
  sections,
  links,
  refetchLinks,
  refetchSections,
}: {
  sections: Section[];
  links: Link[];
  refetchLinks: () => void;
  refetchSections: () => void;
}) => {
  if (sections?.length == 0) return null;

  return (
    <>
      {sections?.map((section) => (
        <SectionPanel
          section={section}
          key={section.id}
          links={links?.filter((link) => link.sectionId == section?.id) ?? []}
          refetchLinks={refetchLinks}
          refetchSections={refetchSections}
        />
      ))}
    </>
  );
};
