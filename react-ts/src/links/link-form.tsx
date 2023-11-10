import { Controller, ControllerFieldState, ControllerRenderProps, useForm } from "react-hook-form";
import { LinkType, useSaveLinkMutation } from "../graphql-types-and-hooks.tsx";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SxProps,
  TextField,
  Tooltip,
} from "@mui/material";
import { useRef, useState } from "react";
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
    <Dialog open={open} onClose={close} TransitionProps={{ onExited: () => reset() }}>
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
              render={(props) => <FaviconField {...props} linkType={watchLinkType} />}
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

type IconFormat = "url" | "base64";

type FaviconFieldProps = {
  field: ControllerRenderProps<LinkFormData, "favicon">;
  fieldState: ControllerFieldState;
  linkType: LinkType;
};

const getPreviewImage = (value: string | null | undefined, format: IconFormat): string | null => {
  if (!value) return null;

  if (value.startsWith("data:image/") && format == "base64") return value;

  if (value.startsWith("http") && format == "url") return value;

  return null;
};

const FaviconField = ({ field, fieldState, linkType }: FaviconFieldProps) => {
  const [iconFormat, setIconFormat] = useState<IconFormat>(field.value?.startsWith("data:image/") ? "base64" : "url");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preview = getPreviewImage(field.value, iconFormat);

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <Select value={iconFormat} onChange={(ev) => setIconFormat(ev.target.value as IconFormat)} size="small">
          <MenuItem value="url">URL</MenuItem>
          <MenuItem value="base64">Image</MenuItem>
        </Select>
        {iconFormat == "url" ? (
          <TextField
            {...field}
            label="Favicon"
            size="small"
            required={linkType == LinkType.Group}
            error={!!fieldState.error}
            fullWidth
          />
        ) : (
          <>
            <Button
              variant="contained"
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.click();
              }}
            >
              Upload new
            </Button>
            <input
              hidden
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={async (event) => {
                if (event.target.files) {
                  const file = event.target.files[0];
                  if (file.size > 32 * 1024) alert("uristen, very big (max 32kb)");
                  field.onChange(await toBase64(file));
                }
              }}
            />
          </>
        )}
        {preview ? <Box component="img" src={preview} alt="yey" sx={{ width: 24, height: 24 }} /> : null}
      </Box>
      <FormHelperText sx={{ ml: 1 }}>
        {fieldState.error?.message ??
          (linkType == LinkType.Single ? "Optional. Leave empty to fetch from the URL" : "")}
      </FormHelperText>
    </Box>
  );
};

const toBase64 = (file: File) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

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
