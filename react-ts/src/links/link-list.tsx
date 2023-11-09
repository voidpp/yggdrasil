import { useRef, useState } from "react";
import { Link, LinkType } from "../graphql-types-and-hooks.tsx";
import { Badge, Box, IconButton, Popover, SxProps, Tooltip, Typography } from "@mui/material";
import { Draggable, Droppable } from "react-beautiful-dnd";
import { DropTargetType } from "../tools.ts";
import { AddLinkFormButton } from "./link-form.tsx";
import HideImageIcon from "@mui/icons-material/HideImage";
import OpenInNew from "@mui/icons-material/OpenInNew";
import { LinkNode } from "../types.ts";
import { useEditMode } from "../edit-mode/edit-mode-context.ts";

import { createLinkListId, useLinksSectionContext } from "./link-tools.ts";
import { LinkMenu } from "./link-menu.tsx";
import { commonStyles } from "../styles.ts";

const styles = {
  linkBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    py: 2,
    pb: 1.5,
    borderRadius: 1,
    transition: "background-color 0.2s, transform 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)",
    position: "relative",
    textDecoration: "none",
    userSelect: "none",
    transform: "scale(1,1)",
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
  },
} satisfies Record<string, SxProps>;

const LinkGroup = ({ link: { children, id, sectionId, title } }: { link: LinkNode }) => {
  const { editMode } = useEditMode();
  const { refetchLinks } = useLinksSectionContext();

  return (
    <Box sx={{ p: 2 }}>
      {title.length > 0 && (
        <Typography variant="h6" sx={{ mb: 2, textShadow: "1px 1px 4px black" }}>
          {title}
        </Typography>
      )}
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <LinkList links={children} sectionId={sectionId} groupId={id} />
        {editMode && (
          <AddLinkFormButton
            sx={{ ml: children.length ? 1 : 0 }}
            onSave={refetchLinks}
            nextRank={Math.max(...children.map((link) => link.rank), 0) + 1}
            sectionId={sectionId}
            linkGroupId={id}
          />
        )}
      </Box>
    </Box>
  );
};

export const LinkFavicon = ({
  link,
  size = "default",
  color = "default",
}: {
  link: Link;
  size?: "small" | "default";
  color?: "default" | "grayscale";
}) => {
  const imgSize = size == "small" ? 16 : 32;
  const filter = color == "grayscale" ? "grayscale(1)" : "none";

  const faviconImage = link.favicon?.length
    ? link.favicon
    : link.url
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(link.url)}&sz=32`
    : null;

  return faviconImage ? (
    <Box component="img" src={faviconImage} alt={link.title} sx={{ width: imgSize, height: imgSize, filter }} />
  ) : (
    <HideImageIcon />
  );
};

const LinkBox = ({ link }: { link: LinkNode }) => {
  const { editMode } = useEditMode();
  const mainBoxRef = useRef<HTMLDivElement>(null);
  const [groupPopoverOpen, setGroupPopoverOpen] = useState(false);

  const closeGroup = () => setGroupPopoverOpen(false);
  const openGroup = () => setGroupPopoverOpen(true);

  return (
    <>
      <Box
        sx={{
          ...styles.linkBox,
          "&:hover": { transform: editMode ? "none" : "scale(1.1,1.1)", backgroundColor: "rgba(0,0,0,0.2)" },
          cursor: editMode && link.type == LinkType.Group ? "default" : "pointer",
        }}
        component={!editMode && link.type == LinkType.Single ? "a" : "div"}
        href={link.url ?? undefined}
        ref={mainBoxRef}
        onClick={!editMode && link.type == LinkType.Group ? openGroup : undefined}
      >
        {editMode && <LinkMenu link={link} />}
        <Tooltip title="Drag to change order or section" disableHoverListener={!editMode}>
          <Box sx={styles.faviconContainer}>
            <Badge
              badgeContent={link.children.length}
              color="primary"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
              <LinkFavicon link={link} />
            </Badge>
          </Box>
        </Tooltip>
        <Box sx={styles.linkTitle}>{link.title}</Box>
        {editMode && link.type == LinkType.Group && (
          <IconButton sx={{ position: "absolute", bottom: 2, right: 2 }} size="small" onClick={openGroup}>
            <OpenInNew fontSize="small" sx={{ transform: "rotate(90deg)" }} color="primary" />
          </IconButton>
        )}
      </Box>
      {link.type == LinkType.Group && (
        <Popover
          open={groupPopoverOpen}
          onClose={closeGroup}
          anchorEl={mainBoxRef.current}
          anchorOrigin={{ horizontal: editMode ? "right" : "left", vertical: editMode ? "bottom" : "top" }}
          slotProps={{ paper: editMode ? {} : { sx: commonStyles.glass } }}
        >
          <LinkGroup link={link} />
        </Popover>
      )}
    </>
  );
};

export const LinkList = ({
  links,
  sectionId,
  groupId = null,
}: {
  links: LinkNode[];
  sectionId: number;
  groupId?: number | null;
}) => {
  const { editMode } = useEditMode();

  return (
    <Droppable
      droppableId={createLinkListId({ sectionId, groupId })}
      direction="horizontal"
      isDropDisabled={!editMode}
      type={groupId ? DropTargetType.LINK_GROUP : DropTargetType.LINK}
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
                  <LinkBox link={link} key={link.id} />
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
