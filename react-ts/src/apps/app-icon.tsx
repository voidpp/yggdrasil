import { IconButton, Tooltip } from "@mui/material";
import { SvgIconComponent } from "@mui/icons-material";

export const AppIcon = ({
  title,
  icon: Icon,
  onOpen,
}: {
  title: string;
  icon: SvgIconComponent;
  onOpen: () => void;
}) => {
  return (
    <IconButton onClick={onOpen}>
      <Tooltip title={title}>
        <Icon fontSize="large" />
      </Tooltip>
    </IconButton>
  );
};
