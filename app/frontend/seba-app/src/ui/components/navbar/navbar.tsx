import React, { useState } from "react";
import { colors } from "../../../styles/colors/Colors";
import { Link, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
} from "@mui/material";
import { useAuth } from "../../../context/AuthContext";
import { Icon } from "../icon/Icon"; // Add this import
import { IconAssets } from "../../../resources/icons/IconAssets";
import { ColorizeRounded } from "@mui/icons-material";

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { isAuthenticated, logout, user, sidebarOpen } = useAuth();
  const navigate = useNavigate();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate("/login");
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: "white",
        width: "calc(100% - 17px)",
        paddingLeft: sidebarOpen ? "280px" : "60px",
        paddingRight: "17px",
        right: "17px",
        transition: (theme) =>
          theme.transitions.create("padding", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        zIndex: 1000,
      }}
      elevation={0}
    >
      <Toolbar>
        <Button
          disableRipple
          color="inherit"
          component={Link}
          to="/"
          sx={{
            color: colors.black,
            fontSize: "20px",
            fontFamily: "var(--font-roboto)",
            fontWeight: "var(--font-roboto-weight-bold)",
            display: "flex",
            alignItems: "center",
            gap: 1.3,
          }}
        >
          <Icon
            path={IconAssets.Logo}
            size={24}
            style={{
              fill: "white",
            }}
          />
          MedSEBA
        </Button>
        <Box sx={{ flexGrow: 1 }} />

        {!isAuthenticated ? (
          <>
            <Button
              sx={{ color: colors.black }}
              component={Link}
              to="/register"
              disableRipple
            >
              Signup
            </Button>
            <Button
              sx={{ color: colors.black }}
              component={Link}
              to="/login"
              disableRipple
            >
              Login
            </Button>
          </>
        ) : (
          <>
            <IconButton onClick={handleMenu} size="small" sx={{ ml: 2 }}>
              <Avatar sx={{ bgcolor: colors.mainColor }}>
                {user?.first_name?.charAt(0) + "" + user?.last_name?.charAt(0)}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem component={Link} to="/profile" onClick={handleClose}>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
