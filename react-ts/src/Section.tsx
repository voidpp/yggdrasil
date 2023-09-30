import { useState } from "react";
import {
  Section,
  SectionsDocument,
  SectionsQuery,
  useDeleteSectionMutation,
  useLinksBySectionQuery,
  useSaveSectionMutation,
  useSaveSectionsRankMutation,
} from "./graphql-types-and-hooks.tsx";
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
import { AddLinkFormButton, LinkBoxList } from "./LinkBox.tsx";
import { useEditMode } from "./editMode.tsx";
import { DragDropContext, Droppable, Draggable, DraggableProvided } from "react-beautiful-dnd";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useApolloClient } from "@apollo/client";
import { sortDropItems } from "./tools.ts";

const styles = {
  sectionContainer: {
    borderRadius: 4,
  },
  panel: {
    backgroundColor: "rgba(0,0,0,0.5)",
    p: 2,
    borderRadius: 2,
    width: "100%",
    position: "relative",
    // Why is this hacky solution for background blur?
    // The most stupid bug I've ever seen: https://github.com/atlassian/react-beautiful-dnd/issues/1826
    "&::before": {
      borderRadius: 2,
      top: 0,
      left: 0,
      content: '""',
      backdropFilter: "blur(5px)",
      position: "absolute",
      width: "100%",
      height: "100%",
      zIndex: -1,
    },
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

const SectionHeader = ({
  section,
  refetchSections,
  dragHandleProps,
}: {
  section: Section;
  refetchSections: () => Promise<unknown>;
  dragHandleProps?: DraggableProvided["dragHandleProps"];
}) => {
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [deleteSection] = useDeleteSectionMutation();
  const { editMode } = useEditMode();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: section.name.length || editMode ? 1 : 0,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Box
          {...dragHandleProps}
          sx={{
            width: editMode ? "auto" : 0,
            height: editMode ? "auto" : 0,
            overflow: "hidden",
            display: "flex",
            mr: 1,
          }}
        >
          <DragIndicatorIcon />
        </Box>
        <Typography variant="h6">{section.name}</Typography>
      </Box>
      {editMode && (
        <Box>
          <Button size="small" onClick={() => setOpenEditDialog(true)}>
            edit
          </Button>
          <Button
            size="small"
            onClick={async () => {
              await deleteSection({ variables: { id: section.id } });
              await refetchSections();
            }}
          >
            delete
          </Button>
        </Box>
      )}
      <SectionFormDialog
        open={openEditDialog}
        close={() => setOpenEditDialog(false)}
        sectionData={removeTypename(section)}
        onSave={refetchSections}
      />
    </Box>
  );
};

const SectionPanel = ({
  section,
  refetchSections,
  dragHandleProps,
}: {
  section: Section;
  refetchSections: () => Promise<unknown>;
  dragHandleProps?: DraggableProvided["dragHandleProps"];
}) => {
  const { editMode } = useEditMode();
  const { data: linksData, refetch: refetchLinks } = useLinksBySectionQuery({ variables: { sectionId: section.id } });
  const links = linksData?.links ?? [];

  return (
    <Box sx={styles.panel}>
      <SectionHeader section={section} refetchSections={refetchSections} dragHandleProps={dragHandleProps} />
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <LinkBoxList links={links} refetchLinks={refetchLinks} sectionId={section.id} />
        {editMode && (
          <AddLinkFormButton
            sx={{ ml: 1 }}
            onSave={refetchLinks}
            nextRank={Math.max(...links.map((link) => link.rank), 0) + 1}
            sectionId={section.id}
          />
        )}
      </Box>
    </Box>
  );
};

export const SectionList = ({
  sections,
  refetchSections,
}: {
  sections: Section[];
  refetchSections: () => Promise<unknown>;
}) => {
  const { editMode } = useEditMode();
  const [saveSectionRanks] = useSaveSectionsRankMutation();
  const client = useApolloClient();

  if (sections.length == 0) return null;

  return (
    <DragDropContext
      onDragEnd={async (result) => {
        if (!result.destination) return;
        const sectionsCopy = sortDropItems(sections, result);

        client.writeQuery<SectionsQuery>({
          query: SectionsDocument,
          data: { sections: sectionsCopy },
        });
        await saveSectionRanks({ variables: { idList: sectionsCopy.map((section) => section.id) } });
        await refetchSections();
      }}
    >
      <Droppable droppableId="droppable-section-list" isDropDisabled={!editMode}>
        {(provided) => (
          <Box {...provided.droppableProps} ref={provided.innerRef} sx={{ width: "100%" }}>
            {sections.map((section, index) => (
              <Draggable
                key={section.id}
                draggableId={`section-item-${section.id}`}
                index={index}
                isDragDisabled={!editMode}
              >
                {(provided) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    style={{ ...provided.draggableProps.style, marginBottom: 8 }}
                  >
                    <SectionPanel
                      section={section}
                      key={section.id}
                      refetchSections={refetchSections}
                      dragHandleProps={provided.dragHandleProps}
                    />
                  </Box>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  );
};
