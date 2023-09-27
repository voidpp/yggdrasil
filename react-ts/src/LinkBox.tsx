import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useDeleteLinkMutation, useSaveLinkMutation } from "./graphql-types-and-hooks.tsx";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  SxProps,
  TextField,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useEditMode } from "./editMode.tsx";

type LinkFormData = {
  id?: number;
  title: string;
  url: string;
  favicon: string;
  sectionId: number;
  rank: number;
};

const SaveLinkFormDialog = ({
  open,
  close,
  linkData,
  onSave,
}: {
  open: boolean;
  close: () => void;
  linkData: LinkFormData;
  onSave: () => void;
}) => {
  const { control, handleSubmit, reset } = useForm<LinkFormData>({ defaultValues: linkData });
  const [saveLink] = useSaveLinkMutation();

  const onSubmit = async (data: LinkFormData) => {
    await saveLink({ variables: { link: data } });
    if (!linkData.id) reset();
    close();
    onSave();
  };

  return (
    <Dialog open={open} onClose={close}>
      <DialogTitle>Save link</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Controller
              name="title"
              control={control}
              render={({ field }) => <TextField {...field} label="Title" size="small" sx={{ mt: 2 }} required />}
            />
            <Controller
              name="url"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="URL" size="small" sx={{ mt: 2, minWidth: 350 }} required />
              )}
            />
            <Controller
              name="favicon"
              control={control}
              render={({ field }) => <TextField {...field} label="Favicon" size="small" sx={{ mt: 2 }} />}
            />
          </Box>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSubmit(onSubmit)}>Save</Button>
        <Button onClick={close}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export const AddLinkFormButton = ({
  onSave,
  nextRank,
  sectionId,
  sx,
}: {
  onSave: () => void;
  nextRank: number;
  sectionId: number;
  sx?: SxProps;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={sx}>
      <Tooltip title="Add link" placement="top" arrow>
        <IconButton onClick={() => setOpen(true)}>
          <AddIcon fontSize="large" />
        </IconButton>
      </Tooltip>
      <SaveLinkFormDialog
        open={open}
        close={() => setOpen(false)}
        linkData={{ title: "", url: "", favicon: "", sectionId, rank: nextRank }}
        onSave={onSave}
      />
    </Box>
  );
};

const styles = {
  linkBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    px: 4,
    py: 2,
    borderRadius: 1,
    transition: "background-color 0.2s",
    position: "relative",
    textDecoration: "none",
    userSelect: "none",
    "&:hover": {
      backgroundColor: "rgba(0,0,0,0.3)",
    },
  },
  menuIconContainer: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  linkTitle: {
    textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
    color: "white",
  },
  faviconContainer: {
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 58,
    height: 58,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "100%",
    mb: 1,
  },
} satisfies Record<string, SxProps>;

const LinkMenu = ({ link, refetchLinks }: { link: Link; refetchLinks: () => void }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openLinkDialog, setOpenLinkDialog] = useState(false);
  const [deleteLink] = useDeleteLinkMutation();

  const handleClose = () => {
    setAnchorEl(null);
  };

  const formLink = { ...link };
  delete formLink.__typename;

  return (
    <>
      <IconButton
        sx={styles.menuIconContainer}
        size="small"
        onClick={(ev) => {
          setAnchorEl(ev.currentTarget);
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleClose}>
        <MenuItem
          onClick={() => {
            handleClose();
            setOpenLinkDialog(true);
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={async () => {
            handleClose();
            await deleteLink({ variables: { id: link.id } });
            refetchLinks();
          }}
        >
          Delete
        </MenuItem>
      </Menu>
      <SaveLinkFormDialog
        open={openLinkDialog}
        close={() => setOpenLinkDialog(false)}
        linkData={formLink}
        onSave={refetchLinks}
      />
    </>
  );
};

export const LinkBox = ({ link, refetchLinks }: { link: Link; refetchLinks: () => void }) => {
  const { editMode } = useEditMode();

  const faviconImage = link.favicon?.length
    ? link.favicon
    : `https://www.google.com/s2/favicons?domain=${encodeURIComponent(link.url)}&sz=32`;

  return (
    <Box sx={styles.linkBox} component={editMode ? "div" : "a"} href={link.url}>
      {editMode && <LinkMenu link={link} refetchLinks={refetchLinks} />}
      <Box sx={styles.faviconContainer}>
        <img src={faviconImage} alt={link.title} />
      </Box>
      <Box sx={styles.linkTitle}>{link.title}</Box>
    </Box>
  );
};
