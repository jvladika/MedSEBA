//import { useProjects } from '../../hooks/useProjects';
import { useState, useEffect } from "react";
import { Box, List, ListSubheader, IconButton, Tooltip } from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import CircularProgress from "@mui/material/CircularProgress";
import { LoadingWheel } from "../../../loadingWheel/LoadingWheel";
import { TextSkeletonLoader } from "../../../loadingWheel/TextSkeletonLoader";
import { Typography } from "@mui/material";
import { ProjectItem } from "./ProjectItem";
import { AddProjectModal } from "./AddProjectModal";
import { api } from "../../../../../data/api/Api";
import { ProjectQueriesSection } from "./ProjectQueriesSection/ProjectQueriesSection";
import { useSidebar } from "../../../../../context/SidebarContext";
import { useNavigate } from "react-router-dom";
import { Button, ListItem } from "@mui/material";
import { colors } from "../../../../../styles/colors/Colors";

interface ProjectSectionProps {
  sidebarOpen: boolean;
  isAuthenticated: boolean;
}

export const ProjectSection = ({ sidebarOpen, isAuthenticated }: ProjectSectionProps) => {
  const {
    projects,
    projectQueries,
    updateProjectQueries,
    isLoadingProjects: isLoading,
    projectsError: error,
    createProject,
    deleteProject,
    renameProject,
  } = useSidebar();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const handleRename = async (itemId: number, newTitle: string) => {
    try {
      await renameProject(itemId, newTitle);
    } catch (error) {
      console.error("Failed to rename project:", error);
    }
  };

  const handleDelete = async (itemId: number) => {
    try {
      await deleteProject(itemId);
    } catch (error) {
      console.error("ProjectSection: Error deleting project:", error);
    }
  };

  return (
    <Box>
      <List
        sx={{
          padding: 0,
          margin: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <ListSubheader
          sx={{
            bgcolor: colors.whiteGray,
            color: colors.black,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pr: 1,
            position: "sticky",
            top: "64px",
            zIndex: 999,
            margin: 0,
            width: "100%",
            boxSizing: "border-box",
            padding: "8px 12px",
          }}
        >
          <Typography
            sx={{
              color: colors.black,
              fontSize: "1rem",
              fontWeight: 600,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              fontFamily: "var(--font-outfit)",
            }}
          >
            Projects
          </Typography>
          {isAuthenticated && (
            <Tooltip 
              title="Create a new project" 
              placement="right"
              arrow
              enterDelay={500}
              componentsProps={{
                tooltip: {
                  sx: {
                    fontSize: '14px',
                    padding: '10px 14px',
                    backgroundColor: colors.lightGray,
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
                    maxWidth: '300px',
                    color: colors.black,
                    fontWeight: 400,
                    lineHeight: 1.5,
                    letterSpacing: '0.15px',
                  }
                },
                arrow: {
                  sx: {
                    color: colors.lightGray
                  }
                }
              }}
            >
              <IconButton
                disableRipple
                onClick={() => setIsModalOpen(true)}
                sx={{
                  color: colors.black,
                  "&:hover": {
                    backgroundColor: colors.lightGray,
                  },
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          )}
        </ListSubheader>

        {!isAuthenticated ? (
          <Box sx={{ padding: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: colors.black }}>
              Please log in to use projects
            </Typography>
            <ListItem
              sx={{
                py: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                px: 1,
              }}
            >
            </ListItem>
          </Box>
        ) : isLoading ? (
          <TextSkeletonLoader />
        ) : error ? (
          <div>Error: {error}</div>
        ) : Array.isArray(projects) && projects.length > 0 ? (
          projects.map((project) => (
            <ProjectQueriesSection
              key={project.id}
              projectId={project.id}
              projectName={project.name}
              sidebarOpen={sidebarOpen}
              projects={projects}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))
        ) : (
          <Box
            sx={{
              padding: 2,
              textAlign: 'center',
              color: colors.black,
              fontSize: '0.875rem',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                mb: 1,
                fontSize: '0.875rem',
                lineHeight: 1.5,
              }}
            >
              No projects yet
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                color: colors.darkGray,
              }}
            >
              Click the + above to create one
            </Typography>
          </Box>
        )}
      </List>
      
      {isAuthenticated && (
        <AddProjectModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={(name, description) => {
            createProject({ name, description });
            setIsModalOpen(false);
          }}
        />
      )}
    </Box>
  );
};
