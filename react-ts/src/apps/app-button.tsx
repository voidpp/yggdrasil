import AppsIcon from "@mui/icons-material/Apps";
import { Box, IconButton, Popover, SxProps } from "@mui/material";
import { useRef, useState } from "react";
import { SimpleLoopTimer } from "./simple-loop-timer.tsx";

const AppList = ({ sx }: { sx?: SxProps }) => {
  return (
    <Box sx={sx}>
      <SimpleLoopTimer />
    </Box>
  );
};

export const AppButton = ({ sx }: { sx?: SxProps }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [appListOpen, setAppListOpen] = useState(false);

  const closeAppList = () => setAppListOpen(false);
  const openAppList = () => setAppListOpen(true);

  return (
    <>
      <IconButton sx={sx} ref={buttonRef} onClick={openAppList}>
        <AppsIcon fontSize="large" sx={{ filter: "drop-shadow(0px 0px 2px black)" }} />
      </IconButton>
      <Popover open={appListOpen} onClose={closeAppList} anchorEl={buttonRef.current}>
        <AppList sx={{ p: 2 }} />
      </Popover>
    </>
  );
};
