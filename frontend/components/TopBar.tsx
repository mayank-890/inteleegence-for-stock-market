"use client";

import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import {
  AppBar,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography
} from "@mui/material";
import { MouseEvent, ReactNode, useState } from "react";

type TopBarProps = {
  title: string;
  subtitle?: string;
  userLabel?: string;
  actions?: ReactNode;
  onLogout?: () => void;
};

export default function TopBar({
  title,
  subtitle,
  userLabel,
  actions,
  onLogout
}: TopBarProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const openMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        mb: 3
      }}
    >
      <Toolbar sx={{ px: { xs: 2, md: 3 } }}>
        <Stack spacing={0.5} sx={{ flex: 1 }}>
          <Typography variant="h5">{title}</Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {actions}
          <IconButton color="inherit" onClick={openMenu}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", color: "#0A1628" }}>
              <MenuRoundedIcon fontSize="small" />
            </Avatar>
          </IconButton>
        </Stack>
      </Toolbar>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem disabled>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <PersonRoundedIcon fontSize="small" />
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {userLabel || "Signed in"}
              </Typography>
            </Box>
          </Stack>
        </MenuItem>
        {onLogout ? (
          <MenuItem
            onClick={() => {
              closeMenu();
              onLogout();
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <LogoutRoundedIcon fontSize="small" />
              <Typography variant="body2">Logout</Typography>
            </Stack>
          </MenuItem>
        ) : null}
      </Menu>
    </AppBar>
  );
}

