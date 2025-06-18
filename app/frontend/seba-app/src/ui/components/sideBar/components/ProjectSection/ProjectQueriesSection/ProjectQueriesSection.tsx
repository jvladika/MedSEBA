import React, { useState, useEffect } from "react";
import {
  ListItem,
  ListItemButton,
  ListItemText,
  Collapse,
  IconButton,
  Box,
} from "@mui/material";
import { SearchHistoryItemType } from "../../../types";
import { SearchHistoryItem } from "../../SearchHistorySection/SearchHistoryItem";
import { SidebarItem } from "../../SidebarItem";
import api from "../../../../../../api";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "../../../../../../navigation/constants/Routes";
import { Project } from "../../../types";
import {
  ExpandMore,
  ExpandLess,
  MoreVert,
  MoreHoriz,
  Delete,
  Edit,
} from "@mui/icons-material";
import { Menu, MenuItem, TextField } from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import { FolderOpen } from "@mui/icons-material";
import { useSidebar } from "../../../../../../context/SidebarContext";
import { useDrop, useDrag } from "react-dnd";
import { ItemTypes } from "../../../types";
import { colors } from "../../../../../../styles/colors/Colors";

interface ProjectQueriesSectionProps {
  projectId: number;
  projectName: string;
  sidebarOpen: boolean;
  projects: Project[];
  onDelete: (id: number) => void;
  onRename: (id: number, newName: string) => void;
  item?: SearchHistoryItemType;
}

export const ProjectQueriesSection = ({
  projectId,
  projectName,
  sidebarOpen,
  projects,
  onDelete,
  onRename,
  item,
}: ProjectQueriesSectionProps) => {
  const [open, setOpen] = useState(false);
  //const [queries, setQueries] = useState<SearchHistoryItemType[]>([]);
  const { projectQueries, updateProjectQueries, updateSearchHistory } =
    useSidebar();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [allowBlur, setAllowBlur] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(projectName);


  // Modify handleRenameClick to prevent immediate blur
  const handleRenameClick = () => {
    setIsEditing(true);
    setEditValue(projectName);
    setAllowBlur(false); // Prevent immediate blur
    setTimeout(() => setAllowBlur(true), 50); // Re-enable blur after TextField is focused
    handleMenuClose();
  };

  // Modify handleRenameSubmit to check allowBlur
  const handleRenameSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (editValue.trim() && editValue !== projectName) {
      onRename(projectId, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(projectName);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    onDelete(projectId);
    handleMenuClose();
  };

  const handleItemClick = () => {
    setOpen(!open);
  };

  const [{ isOver }, drop] = useDrop(() => ({
    accept: [ItemTypes.SEARCH_HISTORY_ITEM, ItemTypes.PROJECT_QUERY],
    drop: async (item: { id: number; sourceProjectId: number | null }) => {
      if (item.sourceProjectId === projectId) {
        return;
      }

      try {
        // Update backend
        await api.post(`/api/search-history/${item.id}/move/`, {
          project_id: projectId,
        });
        // Update frontend states concurrently
        await Promise.all([updateSearchHistory(), updateProjectQueries()]);
      } catch (error) {
        console.error("Error moving item to project:", error);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const handleRename = async (itemId: number, newTitle: string) => {
    try {
      await api.put(`/api/search-history/${itemId}/`, {
        custom_title: newTitle,
      });
      await updateProjectQueries();
    } catch (error) {
      console.error("Error updating title:", error);
    }
  };


  const handleDelete = async (itemId: number) => {
    try {
      await api.delete(`/api/search-history/${itemId}/delete/`);
      await updateProjectQueries();
    } catch (error) {
      console.error("Error deleting search history item:", error);
    }
  };

  return (
    <Box
      ref={drop}
      sx={{
        backgroundColor: isOver ? colors.darkGray : "transparent",
        transition: "background-color 0.2s ease",
        borderRadius: 1,
        width: "100%",
      }}
    >
      <ListItem
        secondaryAction={
          <IconButton
            disableRipple
            edge="end"
            onClick={handleMenuClick}
            sx={{
              color: colors.whiteGray, //"rgba(255, 255, 255, 0.7)",
              "&:hover": {
                backgroundColor: "transparent",
                color: colors.darkGray,
              },
            }}
          >
            <MoreHoriz />
          </IconButton>
        }
        onClick={() => {
          if (projectQueries[projectId]?.length > 0) {
            handleItemClick();
          }
        }}
        sx={{
          cursor: projectQueries[projectId]?.length > 0 ? "pointer" : "default",
          borderRadius: "10px",
          backgroundColor: colors.whiteGray, //"#2A2A2A",
          transition: "all 0.2s ease",
          paddingRight: "48px",
          width: "calc(100% - 32px)",
          maxWidth: "calc(100% - 32px)",
          margin: "5px 16px",
          display: "flex",
          justifyContent: "center",
          position: "relative",
          "&:hover": {
            backgroundColor: colors.lightGray, //"#323232",
            //border: "1px solid rgba(255, 255, 255, 0.2)",
            //transform: "translateY(-1px)",
            //boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: "100%",
            minWidth: 0,
            overflow: "hidden",
          }}
        >
          {open ? (
            <FolderOpen
              sx={{
                color: colors.black,
                fontSize: 24,
                flexShrink: 0,
              }}
            />
          ) : (
            <FolderIcon
              sx={{
                color: colors.black,
                fontSize: 24,
                flexShrink: 0,
              }}
            />
          )}
          {isEditing ? (
            <TextField
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => {
                if (allowBlur) {
                  setIsEditing(false);
                  setEditValue(projectName);
                }
              }}
              onKeyDown={handleRenameKeyDown}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              size="small"
              sx={{
                width: "100%",
                "& .MuiInputBase-root": {
                  color: colors.black,
                  fontSize: "1.1rem",
                  padding: "2px 8px",
                  "& fieldset": {
                    borderColor: colors.mainColor, //"red", //colors.darkGray,//"rgba(255, 255, 255, 0.23)",
                  },
                  "&:hover fieldset": {
                    borderColor: colors.darkGray, //"rgba(255, 255, 255, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: colors.darkGray,//"#fff",
                  },
                },
                "& .MuiInputBase-input": {
                  padding: "4px 8px",
                },
              }}
            />
          ) : (
            <ListItemText
              primary={projectName}
              sx={{
                //backgroundColor: colors.whiteGray,
                margin: 0,
                "& .MuiListItemText-primary": {
                  color: colors.black,
                  fontWeight: 500,
                  fontSize: "1.1rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  width: "100%",
                },
              }}
            />
          )}
        </Box>
      </ListItem>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: colors.white,
            color: colors.black,
            borderRadius: "10px", 
            padding: "8px", 
            minWidth: "180px", 
          },
        }}
      >
        <MenuItem
          onClick={handleRenameClick}
          sx={{
            borderRadius: "8px", 
            padding: "8px 12px", 
            "&:hover": { 
              backgroundColor: colors.lightGray, 
            }
          }}
        >
          <Edit sx={{ mr: 1 }} /> Rename
        </MenuItem>
        <MenuItem
          onClick={handleDeleteClick}
          sx={{
            color: colors.red, //'#ff4d4d',
            borderRadius: "8px",
            padding: "8px 12px",
            '& .MuiSvgIcon-root': {
              color: colors.red, //'#ff4d4d',
            },
            "&:hover": {
              backgroundColor: 'rgba(255, 77, 77, 0.1)',
              color: colors.red, //'#ff6666',
              '& .MuiSvgIcon-root': {
                color: colors.red, //'#ff6666',
              },
            }
          }}
        >
          <Delete sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <Collapse
        in={open}
        timeout="auto"
        unmountOnExit
        sx={{
          color: colors.black,//"white",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {projectQueries[projectId]?.map((query) => (
          <SearchHistoryItem
            key={query.id}
            item={query}
            sidebarOpen={sidebarOpen}
            onRename={handleRename}
            onDelete={handleDelete}
            currentProjectId={projectId}
            projects={projects}
            isFromProject={true}
            //onHistoryUpdate={loadProjectQueries}
          />
        ))}
      </Collapse>
    </Box>
  );
};
