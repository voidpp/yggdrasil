import { useAuthClientsQuery } from "./graphql-types-and-hooks.tsx";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";

export const Login = () => {
  const { data } = useAuthClientsQuery();

  return (
    <Dialog open={true}>
      <DialogTitle>Login</DialogTitle>
      <DialogContent>
        <List>
          {data?.authClients?.map((client) => (
            <ListItemButton
              key={client?.name}
              href={`/auth/login/${client?.name}`}
            >
              <ListItemIcon>
                <Box
                  component="img"
                  src={client?.icon}
                  alt={client?.name}
                  sx={{ width: 32 }}
                />
              </ListItemIcon>
              <ListItemText sx={{ textTransform: "capitalize" }}>
                {client?.name}
              </ListItemText>
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};
