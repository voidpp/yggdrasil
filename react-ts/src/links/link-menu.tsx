import { Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, SxProps } from "@mui/material";
import { LinkNode } from "../types.ts";
import { useMemo, useState } from "react";
import { Link, LinkInput, LinkType, useDeleteLinkMutation, useSaveLinkMutation } from "../graphql-types-and-hooks.tsx";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DeleteIcon from "@mui/icons-material/Delete";
import { PartialBy, removeTypename } from "../tools.ts";
import { cleanLinkDataForSave, useLinksSectionContext } from "./link-tools.ts";
import { SaveLinkFormDialog } from "./link-form.tsx";
import { NestedMenuItem } from "mui-nested-menu";
import { LinkFavicon } from "./link-list.tsx";

const styles = {
  menuIconContainer: {
    position: "absolute",
    top: 2,
    right: 2,
  },
} satisfies Record<string, SxProps>;

const convertLinkNodeToInput = (link: PartialBy<LinkNode, "children">): LinkInput => {
  const linkInput = removeTypename(link);
  delete linkInput.children;
  cleanLinkDataForSave(linkInput);
  return linkInput;
};

const useMoveToParent = (targetLink: LinkNode) => {
  const [saveLink] = useSaveLinkMutation();
  const { linkList, refetchLinks } = useLinksSectionContext();

  return async () => {
    const parentLink = linkList.filter((link) => link.id == targetLink.linkGroupId)[0];
    const linkInput = convertLinkNodeToInput(targetLink);
    linkInput.linkGroupId = parentLink.linkGroupId;
    await saveLink({ variables: { link: linkInput } });
    await refetchLinks();
  };
};

const useLinkGroupList = (targetLink: LinkNode) => {
  const { linkList } = useLinksSectionContext();

  return useMemo(() => {
    return linkList
      .filter((link) => link.type == LinkType.Group && link.id !== targetLink.id && link.id !== targetLink.linkGroupId)
      .map((link) => link);
  }, [targetLink, linkList]);
};

const LinkGroupMenu = ({
  links,
  onMoveToGroup,
}: {
  links: Link[];
  onMoveToGroup: (linkId: number) => Promise<void>;
}) => {
  return (
    <NestedMenuItem
      label="Move to group..."
      parentMenuOpen={true}
      leftIcon={<OpenInNewIcon sx={{ transform: "rotate(90deg)", mr: 0.5 }} />}
      sx={{ px: 2 }}
    >
      {links.map((link) => (
        <MenuItem
          key={link.id}
          onClick={async () => {
            await onMoveToGroup(link.id);
          }}
        >
          <ListItemIcon>
            <LinkFavicon link={link} size="small" color="grayscale" />
          </ListItemIcon>
          <ListItemText>{link.title}</ListItemText>
        </MenuItem>
      ))}
    </NestedMenuItem>
  );
};

export const LinkMenu = ({ link }: { link: LinkNode }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openLinkDialog, setOpenLinkDialog] = useState(false);
  const [deleteLink] = useDeleteLinkMutation();
  const moveToParent = useMoveToParent(link);
  const linkGroups = useLinkGroupList(link);
  const [saveLink] = useSaveLinkMutation();
  const { refetchLinks } = useLinksSectionContext();

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        sx={styles.menuIconContainer}
        size="small"
        color="primary"
        onClick={(ev) => {
          ev.stopPropagation();
          setAnchorEl(ev.currentTarget);
        }}
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleClose} autoFocus={false}>
        <MenuItem
          onClick={async () => {
            handleClose();
            setOpenLinkDialog(true);
          }}
        >
          <ListItemIcon>
            <EditIcon />
          </ListItemIcon>
          <ListItemText>Edit link</ListItemText>
        </MenuItem>
        {link.linkGroupId !== null && (
          <MenuItem onClick={moveToParent}>
            <ListItemIcon>
              <OpenInNewIcon sx={{ transform: "rotate(-90deg)" }} />
            </ListItemIcon>
            <ListItemText>Move to parent</ListItemText>
          </MenuItem>
        )}
        {linkGroups.length > 0 && (
          <LinkGroupMenu
            links={linkGroups}
            onMoveToGroup={async (groupId) => {
              await saveLink({ variables: { link: { ...convertLinkNodeToInput(link), linkGroupId: groupId } } });
              await refetchLinks();
            }}
          />
        )}
        <Divider sx={{ my: 1 }} />
        <MenuItem
          onClick={async () => {
            handleClose();
            await deleteLink({ variables: { id: link.id } });
            await refetchLinks();
          }}
        >
          <ListItemIcon>
            <DeleteIcon />
          </ListItemIcon>
          <ListItemText>Delete link</ListItemText>
        </MenuItem>
      </Menu>
      <SaveLinkFormDialog
        open={openLinkDialog}
        close={() => setOpenLinkDialog(false)}
        linkData={convertLinkNodeToInput(link) as never}
        onSave={refetchLinks}
      />
    </>
  );
};
