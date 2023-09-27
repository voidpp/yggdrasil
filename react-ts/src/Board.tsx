import { useLinksQuery, useSectionsQuery } from "./graphql-types-and-hooks.tsx";
import { Box, Button, SxProps, Typography } from "@mui/material";
import { AddSectionFormButton, SectionList } from "./Section.tsx";
import { useEditMode } from "./editMode.tsx";
import { UserMenu } from "./UserMenu.tsx";
import { useEffect } from "react";

const styles = {
  boardContainer: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  board: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 1,
  },
  boardTitle: {
    backgroundColor: "rgba(0,0,0,0.5)",
    px: 2,
    py: 1,
    borderRadius: 2,
    backdropFilter: "blur(5px)",
    display: "flex",
    alignItems: "center",
    gap: 3,
    width: "100%",
    justifyContent: "space-between",
  },
} satisfies Record<string, SxProps>;

const EditModeButton = () => {
  const { editMode, setEditMode } = useEditMode();

  return (
    <Button
      onClick={() => setEditMode(!editMode)}
      sx={{ m: 1, backgroundColor: "rgba(0,0,0,0.2)", backdropFilter: "blur(4px)" }}
    >
      edit mode: {editMode ? "on" : "off"}
    </Button>
  );
};

export const Board = () => {
  const { data: sectionsData, refetch: refetchSections } = useSectionsQuery();
  const { data: linksData, refetch: refetchLinks } = useLinksQuery();
  const { editMode, setEditMode } = useEditMode();

  const sections = sectionsData?.sections ?? [];

  useEffect(() => {
    if (sections.length == 0) setEditMode(true);
  }, [sections.length, setEditMode]);

  return (
    <Box sx={styles.boardContainer}>
      <Box sx={{ position: "absolute", top: 0, left: 0 }}>
        <EditModeButton />
      </Box>
      <Box sx={{ position: "absolute", top: 0, right: 0 }}>
        <UserMenu />
      </Box>
      <Box sx={styles.board}>
        <Box sx={styles.boardTitle}>
          <Typography variant="h5">Yggdrasil</Typography>
          {editMode && (
            <AddSectionFormButton
              onSave={refetchSections}
              nextRank={Math.max(...sections.map((section) => section.rank), 0) + 1}
            />
          )}
        </Box>
        <SectionList
          sections={sections}
          links={linksData?.links ?? []}
          refetchLinks={refetchLinks}
          refetchSections={refetchSections}
        />
      </Box>
    </Box>
  );
};
