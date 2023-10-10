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
import { Draggable, Droppable } from "react-beautiful-dnd";
import { DropTargetType, removeTypename } from "./tools.ts";

type LinkFormData = {
  id?: number;
  title: string;
  url: string;
  favicon?: string | null;
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
  const { control, handleSubmit, reset, setError } = useForm<LinkFormData>({ defaultValues: linkData });
  const [saveLink] = useSaveLinkMutation();

  const onSubmit = async (data: LinkFormData) => {
    const result = await saveLink({ variables: { link: data } });
    if (result.data?.saveLink?.errors?.length) {
      for (const error of result.data.saveLink.errors) {
        if (error && error.loc) setError(error.loc[1] as keyof LinkFormData, { message: error.msg });
      }
    } else {
      if (!linkData.id) reset();
      close();
      onSave();
    }
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
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Title"
                  size="small"
                  sx={{ mt: 2 }}
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="url"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="URL"
                  size="small"
                  sx={{ mt: 2, minWidth: 350 }}
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="favicon"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Favicon"
                  size="small"
                  sx={{ mt: 2 }}
                  helperText="Optional. Leave empty to fetch from the URL"
                />
              )}
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
      <Tooltip title="Add link">
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
    py: 2,
    pb: 1.5,
    borderRadius: 1,
    transition: "background-color 0.2s",
    position: "relative",
    textDecoration: "none",
    userSelect: "none",
    "&:hover": {
      backgroundColor: "rgba(0,0,0,0.2)",
    },
  },
  menuIconContainer: {
    position: "absolute",
    top: 0,
    right: 0,
  },
  linkTitle: {
    textShadow: "2px 2px 2px black",
    color: "white",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 120,
    px: 1,
    whiteSpace: "nowrap",
  },
  linkList: {
    display: "flex",
    alignItems: "center",
  },
  faviconContainer: {
    mx: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 58,
    height: 58,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "100%",
    mb: 1,
    "& > img": {
      width: 32,
      height: 32,
    },
  },
} satisfies Record<string, SxProps>;

const LinkMenu = ({ link, refetchLinks }: { link: Link; refetchLinks: () => void }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openLinkDialog, setOpenLinkDialog] = useState(false);
  const [deleteLink] = useDeleteLinkMutation();

  const handleClose = () => {
    setAnchorEl(null);
  };

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
        linkData={removeTypename(link)}
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
      <Tooltip title="Drag to change order or section" disableHoverListener={!editMode}>
        <Box sx={styles.faviconContainer}>
          <img src={faviconImage} alt={link.title} />
        </Box>
      </Tooltip>
      <Box sx={styles.linkTitle}>{link.title}</Box>
    </Box>
  );
};

export const LinkBoxList = ({
  links,
  refetchLinks,
  sectionId,
}: {
  refetchLinks: () => Promise<unknown>;
  links: Link[];
  sectionId: number;
}) => {
  const { editMode } = useEditMode();

  return (
    <Droppable
      droppableId={`link_list-${sectionId}`}
      direction="horizontal"
      isDropDisabled={!editMode}
      type={DropTargetType.LINK}
    >
      {(provided) => (
        <Box {...provided.droppableProps} ref={provided.innerRef} sx={styles.linkList}>
          {links.map((link, index) => (
            <Draggable key={link.id} draggableId={`link_item-${link.id}`} index={index} isDragDisabled={!editMode}>
              {(provided) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  style={provided.draggableProps.style}
                >
                  <LinkBox link={link} key={link.id} refetchLinks={refetchLinks} />
                </Box>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </Box>
      )}
    </Droppable>
  );
};
