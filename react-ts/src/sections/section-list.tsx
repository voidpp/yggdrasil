import { useMemo, useState } from "react";
import { Link, Section, useDeleteSectionMutation, useLinksBySectionQuery } from "../graphql-types-and-hooks.tsx";
import { Box, Button, SxProps, Theme, Tooltip, Typography } from "@mui/material";
import { LinkList } from "../links/link-list.tsx";
import { DragDropContext, Draggable, DraggableProvided, Droppable } from "react-beautiful-dnd";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { DropTargetType, removeTypename } from "../tools.ts";
import { useDragEndHandler } from "../sortable-handlers.ts";
import { commonStyles } from "../styles.ts";
import { LinkNode } from "../types.ts";
import { useEditMode } from "../edit-mode/edit-mode-context.ts";
import { SectionFormDialog } from "./section-form.tsx";
import { AddLinkFormButton } from "../links/link-form.tsx";
import { LinksSectionContext } from "../links/link-tools.ts";

const styles = {
  sectionContainer: {
    borderRadius: 4,
  },
  panel: {
    p: 2,
    borderRadius: 2,
    width: "100%",
    position: "relative",
    ...commonStyles.editModePanel,
  },
} satisfies Record<string, SxProps<Theme>>;

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
            color: "primary.main",
            width: editMode ? "auto" : 0,
            height: editMode ? "auto" : 0,
            overflow: "hidden",
            display: "flex",
            mr: 1,
          }}
        >
          <Tooltip title="Drag to change order">
            <DragIndicatorIcon />
          </Tooltip>
        </Box>
        <Typography variant="h6" sx={{ textShadow: "1px 1px 4px black" }}>
          {section.name}
        </Typography>
      </Box>
      {editMode && (
        <Box>
          <Button size="small" onClick={() => setOpenEditDialog(true)} sx={commonStyles.buttonOnGlass}>
            edit
          </Button>
          <Button
            sx={commonStyles.buttonOnGlass}
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

const buildLinkTree = (links: Link[], parentLinkId?: number): LinkNode[] => {
  return links
    .filter((link) => link.linkGroupId == parentLinkId)
    .map((link) => ({ ...link, children: buildLinkTree(links, link.id) }));
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
  const links = useMemo(() => buildLinkTree(linksData?.links ?? []), [linksData?.links]);

  return (
    <LinksSectionContext.Provider value={{ linkList: linksData?.links ?? [], linkTree: links, refetchLinks }}>
      <Box sx={{ ...styles.panel, ...(editMode ? {} : commonStyles.glass) }}>
        <SectionHeader section={section} refetchSections={refetchSections} dragHandleProps={dragHandleProps} />
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <LinkList links={links} sectionId={section.id} />
          {editMode && (
            <AddLinkFormButton
              sx={{ ml: links.length ? 1 : 0 }}
              onSave={refetchLinks}
              nextRank={Math.max(...links.map((link) => link.rank), 0) + 1}
              sectionId={section.id}
            />
          )}
        </Box>
      </Box>
    </LinksSectionContext.Provider>
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
  const onDragEnd = useDragEndHandler();

  if (sections.length == 0) return null;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="section_list" isDropDisabled={!editMode} type={DropTargetType.SECTION}>
        {(provided) => (
          <Box {...provided.droppableProps} ref={provided.innerRef} sx={{ width: "100%" }}>
            {sections.map((section, index) => (
              <Draggable
                key={section.id}
                draggableId={`section_item-${section.id}`}
                index={index}
                isDragDisabled={!editMode}
              >
                {(provided) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    style={{ ...provided.draggableProps.style, marginBottom: 12 }}
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
