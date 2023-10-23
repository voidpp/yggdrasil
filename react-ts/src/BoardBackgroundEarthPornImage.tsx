import {
  BoardBackgroundType,
  useBoardSettingsQuery,
  useEarthPornImagesQuery,
  useSaveBoardSettingsMutation,
} from "./graphql-types-and-hooks.tsx";
import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Link,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  SxProps,
  Theme,
  Typography,
} from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import MenuIcon from "@mui/icons-material/Menu";
import { Helmet } from "react-helmet";
import { commonStyles } from "./styles.ts";
import InfoIcon from "@mui/icons-material/Info";

const styles = {
  backgroundTitle: {
    position: "fixed",
    right: -1,
    bottom: -1,
    px: 1,
    py: 0.5,
    borderTopLeftRadius: 4,
    display: "flex",
    alignItems: "center",
    gap: 1,
    ...commonStyles.glass,
    ...commonStyles.buttonOnGlass,
  },
  imageLink: {
    lineHeight: 0,
    "&:hover": {
      color: (theme) => theme.palette.primary.dark,
    },
  },
} satisfies Record<string, SxProps<Theme>>;

type EarthPornSettings = {
  id?: string;
};

const useEarthPornSettings = () => {
  const { data: boardSettingsData, refetch } = useBoardSettingsQuery();
  const [saveBoardSettings] = useSaveBoardSettingsMutation();

  const settings: EarthPornSettings = {};

  try {
    Object.assign(settings, JSON.parse(boardSettingsData?.boardSettings?.background?.value ?? ""));
  } catch (e) {
    console.debug("JSON parse error on parsing settings", e);
  }

  return {
    settings,
    async saveSettings(data: EarthPornSettings) {
      await saveBoardSettings({
        variables: {
          settings: {
            background: {
              type: boardSettingsData?.boardSettings?.background?.type ?? BoardBackgroundType.Earthporn,
              value: JSON.stringify(data),
            },
          },
        },
      });
      await refetch();
    },
  };
};

const useImage = () => {
  const { data: earthPornImagesData } = useEarthPornImagesQuery();
  const { settings, saveSettings } = useEarthPornSettings();
  const images = earthPornImagesData?.earthPornImages ?? [];
  const [imageIndex, setImageIndex] = useState(() => {
    const initialIndex = images.findIndex((img) => img.id === settings.id);
    return initialIndex == -1 ? 0 : initialIndex;
  });

  const image = images[imageIndex] ?? null;

  const setImage = async (index: number) => {
    setImageIndex(index);
    await saveSettings({ id: images[index].id });
  };

  return {
    image,
    resetDisabled: settings.id === undefined,
    isFirstImage: imageIndex === 0,
    isLastImage: imageIndex === images.length - 1,
    async loadNextImage() {
      await setImage(imageIndex + 1);
    },
    async loadPrevImage() {
      await setImage(imageIndex - 1);
    },
    async resetImage() {
      setImageIndex(0);
      await saveSettings({});
    },
  };
};

export const BoardBackgroundEarthPornImage = () => {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const { image, loadNextImage, loadPrevImage, resetImage, resetDisabled, isLastImage, isFirstImage } = useImage();
  const [openHelpDialog, setOpenHelpDialog] = useState(false);

  if (image === null) return null;

  const handleCloseMenu = () => setMenuAnchorEl(null);

  return (
    <Box sx={styles.backgroundTitle}>
      <Menu
        anchorEl={menuAnchorEl}
        open={!!menuAnchorEl}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <MenuItem disabled={isLastImage} onClick={loadNextImage}>
          <ListItemIcon>
            <SkipNextIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Next image</ListItemText>
        </MenuItem>
        <MenuItem disabled={isFirstImage} onClick={loadPrevImage}>
          <ListItemIcon>
            <SkipPreviousIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Previous image</ListItemText>
        </MenuItem>
        <MenuItem onClick={resetImage} disabled={resetDisabled}>
          <ListItemIcon>
            <RestartAltIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Reset</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setOpenHelpDialog(true)}>
          <ListItemIcon>
            <InfoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Info</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem href={image.url} target="_blank" component="a">
          <ListItemIcon>
            <OpenInNewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Open image</ListItemText>
        </MenuItem>
      </Menu>
      <Dialog
        open={openHelpDialog}
        onClose={() => setOpenHelpDialog(false)}
        TransitionProps={{ onEntered: handleCloseMenu }}
      >
        <DialogTitle>EarthPorn image background selector</DialogTitle>
        <HelpContent />
        <DialogActions>
          <Button onClick={() => setOpenHelpDialog(false)}>close</Button>
        </DialogActions>
      </Dialog>
      {image.title}
      <IconButton onClick={(ev) => setMenuAnchorEl(ev.currentTarget)} size="small">
        <MenuIcon fontSize="small" />
      </IconButton>
      <Helmet>
        <style>{`body { background-image: url('${image.url}'); }`}</style>
      </Helmet>
    </Box>
  );
};

const HelpContent = () => (
  <DialogContent sx={{ "& > p:not(:last-child)": { mb: 2 } }}>
    <Typography>
      This background mode loads the "hot" page of the Reddit's{" "}
      <Link href="https://www.reddit.com/r/EarthPorn/">EarthPorn subredit</Link> and use the first picture as a
      background. The content of the image list is cached in the Yggdrasil server for 24 hours.
    </Typography>
    <Typography>
      Clicking the "Next image" and "Previous image" in the menu will use the next or previous image and saves to the
      settings. The chosen image will be used until if it's in the list. If the image rotates out (maybe days), the
      first image will be used.
    </Typography>
    <Typography>The "Reset" menu item will reset to the everytime first image in the image list.</Typography>
  </DialogContent>
);
