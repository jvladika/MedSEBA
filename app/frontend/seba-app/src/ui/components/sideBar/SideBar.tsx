import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { styled, Theme, CSSObject } from "@mui/material/styles";
import { ProjectSection } from "./components/ProjectSection/ProjectSection";
import { SearchHistorySection } from "./components/SearchHistorySection/SearchHistorySection";
import { SidebarHeader } from "./components/SidebarHeader/SidebarHeader";
import { IconAssets } from "../../../resources/icons/IconAssets";
import { Icon } from "../icon/Icon";
import { style } from "../../../styles";
import { colors } from "../../../styles/colors/Colors";

import { Drawer } from "@mui/material";

import {
  Box,
  CssBaseline,
  Drawer as MuiDrawer,
  Divider,
  IconButton,
  Typography,
  Button,
  ListItem,
} from "@mui/material";
interface SideBarProps {
  query?: string;
}

export const SideBar = ({ query }: SideBarProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, sidebarOpen = false, toggleSidebar } = useAuth();

  

  return (
    <Box>
      <CssBaseline />
      <Drawer
        variant="permanent"
        open={sidebarOpen}
        sx={{
          width: sidebarOpen ? 300 : 60,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: sidebarOpen ? 300 : 60,
            boxSizing: 'border-box',
            backgroundColor: colors.whiteGray,
            overflowX: 'hidden',
            
            '&::-webkit-scrollbar': {
              width: sidebarOpen ? '6px' : 0,
              //backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: colors.lightGray,
              borderRadius: '3px',
              '&:hover': {
                backgroundColor: colors.darkGray,
              },
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: colors.whiteGray,
              borderRadius: '3px',
            },


            transition: theme => theme.transitions.create(['width'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            
            // Hide content when sidebar is closed
            '& .MuiListItem-root, & .MuiListItemText-root': {
              opacity: sidebarOpen ? 1 : 0,
              visibility: sidebarOpen ? 'visible' : 'hidden',
              whiteSpace: 'nowrap',
              width: '100%',
              transition: theme => theme.transitions.create(['opacity', 'visibility'], {
                easing: theme.transitions.easing.sharp,
                duration: sidebarOpen ? 
                  theme.transitions.duration.enteringScreen : 
                  theme.transitions.duration.leavingScreen,
                
              }),
            },
            // Only show icons when closed
            '& .MuiListItemIcon-root': {
              minWidth: 0,
              marginRight: sidebarOpen ? 3 : 'auto',
              justifyContent: 'center',
            }
          },
        }}
      >
        {/* Sidebar Header */}
        <SidebarHeader onClick={toggleSidebar} sidebarOpen={sidebarOpen} />
        
        {/* Only render content when sidebar is open */}
        <Box sx={{ 
          opacity: sidebarOpen ? 1 : 0,
          visibility: sidebarOpen ? 'visible' : 'hidden',
          transition: theme => theme.transitions.create(['opacity', 'visibility'], {
            duration: theme.transitions.duration.enteringScreen,
          })
        }}>

          {/* Project Section */}
          <ProjectSection 
            sidebarOpen={sidebarOpen}
            isAuthenticated={isAuthenticated}
          />

          {/* Search History Section */}
          <SearchHistorySection
            sidebarOpen={sidebarOpen}
            isAuthenticated={isAuthenticated}
          />

        </Box>
      </Drawer>
    </Box>
  );
};

export default SideBar;
