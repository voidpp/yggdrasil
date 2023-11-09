import { Controller, useForm } from "react-hook-form";
import { LinkType, useSaveLinkMutation } from "../graphql-types-and-hooks.tsx";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SxProps,
  TextField,
  Tooltip,
} from "@mui/material";
import { useState } from "react";
import { cleanLinkDataForSave } from "./link-tools.ts";
import AddIcon from "@mui/icons-material/Add";

type LinkFormData = {
  id?: number;
  title: string;
  url?: string | null;
  favicon?: string | null;
  sectionId: number;
  rank: number;
  type: LinkType;
  linkGroupId?: number | null;
};

const linkTypeTitle: Record<LinkType, string> = {
  [LinkType.Single]: "Single",
  [LinkType.Group]: "Group",
};

const formatLinkForForm = (data: LinkFormData): LinkFormData => {
  const copy = { ...data };
  if (copy.url == null) copy.url = "";
  if (copy.favicon == null) copy.favicon = "";
  return copy;
};

export const SaveLinkFormDialog = ({
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
  const { control, handleSubmit, reset, setError, watch } = useForm<LinkFormData>({
    defaultValues: async () => formatLinkForForm(linkData),
  });
  const [saveLink] = useSaveLinkMutation();

  const onSubmit = async (data: LinkFormData) => {
    const linkInput = { ...data };

    cleanLinkDataForSave(linkInput);

    const result = await saveLink({ variables: { link: linkInput } });

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

  const watchLinkType = watch("type");

  return (
    <Dialog open={open} onClose={close}>
      <DialogTitle>{linkData.id ? "Save" : "Create"} link</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 300, pt: 1 }}>
            <Controller
              name="title"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Title"
                  size="small"
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth disabled={linkData.id !== undefined}>
                  <InputLabel>Link type</InputLabel>
                  <Select {...field} required size="small" label="Link type">
                    {Object.values(LinkType).map((option) => (
                      <MenuItem value={option} key={option}>
                        {linkTypeTitle[option]}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            />
            {watchLinkType == LinkType.Single && (
              <Controller
                name="url"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="URL"
                    size="small"
                    required
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            )}
            <Controller
              name="favicon"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Favicon"
                  size="small"
                  required={watchLinkType == LinkType.Group}
                  error={!!fieldState.error}
                  helperText={
                    fieldState.error?.message ??
                    (watchLinkType == LinkType.Single ? "Optional. Leave empty to fetch from the URL" : "")
                  }
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
  linkGroupId,
}: {
  onSave: () => void;
  nextRank: number;
  sectionId: number;
  sx?: SxProps;
  linkGroupId?: number;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Box sx={sx}>
      <Tooltip title="Add link">
        <IconButton onClick={() => setOpen(true)}>
          <AddIcon fontSize="large" color="primary" />
        </IconButton>
      </Tooltip>
      <SaveLinkFormDialog
        open={open}
        close={() => setOpen(false)}
        linkData={{ title: "", url: "", favicon: "", sectionId, rank: nextRank, type: LinkType.Single, linkGroupId }}
        onSave={onSave}
      />
    </Box>
  );
};
