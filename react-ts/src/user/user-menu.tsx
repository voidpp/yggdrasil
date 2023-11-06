import { Avatar, Box, IconButton, Menu, MenuItem } from "@mui/material";
import { useCurrentUser } from "./current-user-context.ts";
import { useState } from "react";

export const UserMenu = () => {
  const { currentUser } = useCurrentUser();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ m: 1, display: "flex", alignItems: "center", gap: 1 }}>
      <IconButton onClick={(ev) => setAnchorEl(ev.currentTarget)}>
        <Avatar src={currentUser?.picture} alt={currentUser?.givenName} />
      </IconButton>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleClose}>
        <MenuItem href="/auth/logout" component="a">
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
};
