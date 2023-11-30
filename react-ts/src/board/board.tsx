import {
  BoardBackgroundType,
  BoardSettings,
  useBoardSettingsQuery,
  useSaveBoardSettingsMutation,
  useSectionsQuery,
} from "../graphql-types-and-hooks.tsx";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SxProps,
  TextField,
  Theme,
  Typography,
} from "@mui/material";
import { SectionList } from "../sections/section-list.tsx";
import { UserMenu } from "../user/user-menu.tsx";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { BoardBackgroundStyle } from "./board-background-style.tsx";
import { commonStyles } from "../styles.ts";
import { useEditMode } from "../edit-mode/edit-mode-context.ts";
import { EditModeControl } from "../edit-mode/edit-mode-widgets.tsx";
import { AddSectionFormButton } from "../sections/section-form.tsx";
import { AppButton } from "../apps/app-button.tsx";

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
    px: 2,
    py: 1,
    borderRadius: 2,
    display: "flex",
    alignItems: "center",
    gap: 3,
    width: "100%",
    justifyContent: "space-between",
    ...commonStyles.editModePanel,
  },
  userMenu: {
    position: "absolute",
    top: 0,
    right: 0,
    display: "flex",
    alignItems: "center",
    zIndex: (theme) => theme.zIndex.modal - 1,
  },
} satisfies Record<string, SxProps<Theme>>;

type BoardSettingsFormData = {
  backgroundType: BoardBackgroundType;
  backgroundColor: string;
  backgroundImage: string;
};

const backgroundTypeTitle: Record<BoardBackgroundType, string> = {
  [BoardBackgroundType.Color]: "Color",
  [BoardBackgroundType.Image]: "Image",
  [BoardBackgroundType.Earthporn]: "r/EarthPorn",
};

const BoardSettingsDialogButton = ({ settings, onSave }: { settings: BoardSettings; onSave: () => void }) => {
  const [open, setOpen] = useState(false);
  const [saveBoardSettings] = useSaveBoardSettingsMutation();
  const { control, handleSubmit, reset, watch } = useForm<BoardSettingsFormData>({
    defaultValues: {
      backgroundType: settings.background?.type,
      backgroundColor: settings.background?.type == BoardBackgroundType.Color ? settings.background?.value : "",
      backgroundImage: settings.background?.type == BoardBackgroundType.Image ? settings.background?.value : "",
    },
  });
  const watchBackgroundType = watch("backgroundType");

  const close = () => {
    setOpen(false);
  };

  const onSubmit = async (data: BoardSettingsFormData) => {
    let value = "";
    if (data.backgroundType == BoardBackgroundType.Color) value = data.backgroundColor;
    else if (data.backgroundType == BoardBackgroundType.Image) value = data.backgroundImage;

    await saveBoardSettings({ variables: { settings: { background: { type: data.backgroundType, value } } } });
    close();
    onSave();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} sx={commonStyles.buttonOnGlass}>
        settings
      </Button>
      <Dialog open={open} onClose={close} TransitionProps={{ onExited: () => reset() }}>
        <DialogTitle sx={{ pb: 0 }}>Board settings</DialogTitle>
        <DialogContent sx={{ pb: 0 }}>
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
          >
            <Controller
              name="backgroundType"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth sx={{ minWidth: 250 }}>
                  <InputLabel id="demo-simple-select-label">Background type</InputLabel>
                  <Select {...field} required size="small" label="Background type">
                    {Object.values(BoardBackgroundType).map((option) => (
                      <MenuItem value={option} key={option}>
                        {backgroundTypeTitle[option]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            {watchBackgroundType == BoardBackgroundType.Color && (
              <Controller
                name="backgroundColor"
                control={control}
                render={({ field }) => <TextField {...field} label="Background color" size="small" fullWidth />}
              />
            )}
            {watchBackgroundType == BoardBackgroundType.Image && (
              <Controller
                name="backgroundImage"
                control={control}
                render={({ field }) => <TextField {...field} label="Background image URL" size="small" fullWidth />}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubmit(onSubmit)}>Save</Button>
          <Button onClick={close}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export const Board = () => {
  const { data: sectionsData, refetch: refetchSections } = useSectionsQuery();
  const { editMode } = useEditMode();
  const { data: boardSettingsData, refetch: refetchBoardSettings } = useBoardSettingsQuery();

  const sections = sectionsData?.sections ?? [];

  return (
    <Box sx={styles.boardContainer} data-name="board-container">
      {boardSettingsData?.boardSettings?.background && (
        <BoardBackgroundStyle settings={boardSettingsData?.boardSettings?.background} />
      )}
      <Box sx={{ position: "absolute", top: 0, left: 0, zIndex: (theme) => theme.zIndex.modal - 1 }}>
        <EditModeControl />
      </Box>
      <Box sx={styles.userMenu}>
        <AppButton />
        <UserMenu />
      </Box>
      <Box sx={styles.board} data-name="board">
        {editMode && (
          <Box sx={styles.boardTitle}>
            <Typography variant="h5">Edit mode</Typography>
            <Box>
              {boardSettingsData?.boardSettings && (
                <BoardSettingsDialogButton settings={boardSettingsData?.boardSettings} onSave={refetchBoardSettings} />
              )}
              <AddSectionFormButton
                onSave={refetchSections}
                nextRank={Math.max(...sections.map((section) => section.rank), 0) + 1}
              />
            </Box>
          </Box>
        )}
        <SectionList sections={sections} refetchSections={refetchSections} />
      </Box>
    </Box>
  );
};
