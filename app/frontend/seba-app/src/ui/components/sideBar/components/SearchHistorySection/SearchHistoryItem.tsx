import React, { useState } from "react";
import { SidebarItem } from "../SidebarItem";
import { SearchHistoryItemType, Project } from "../../types";
import { AppRoutes } from "../../../../../navigation/constants/Routes";
import { useNavigate } from "react-router-dom";
import { ProjectSelectMenu } from "../ProjectSelectMenu/ProjectSelectMenu";
import api from "../../../../../api";
import { useSidebar } from "../../../../../context/SidebarContext";
import { DragPreviewImage, useDrag, useDrop } from "react-dnd";
import { ItemTypes } from "../../types";
import { colors } from "../../../../../styles/colors/Colors";

interface SearchHistoryItemProps {
  item: SearchHistoryItemType;
  sidebarOpen: boolean;
  onRename: (id: number, newTitle: string) => void;
  onDelete: (id: number) => void;
  currentProjectId: number | null;
  projects: Project[];
  isFromProject?: boolean;
}

export const SearchHistoryItem = ({
  item,
  sidebarOpen,
  onRename,
  onDelete,
  currentProjectId,
  projects,
  isFromProject = false,
}: //onHistoryUpdate,
SearchHistoryItemProps) => {
  const { updateSearchHistory, updateProjectQueries, setSearchHistory } = useSidebar();
  //const { projects: currentProjects } = useProjects();
  const navigate = useNavigate();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [projectMenuAnchor, setProjectMenuAnchor] =
    useState<null | HTMLElement>(null);

  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: isFromProject
      ? ItemTypes.PROJECT_QUERY
      : ItemTypes.SEARCH_HISTORY_ITEM,
    item: {
      id: item.id,
      type: isFromProject ? "projectQuery" : "searchHistoryItem",
      title: item.custom_title || item.query_text,
      sourceProjectId: currentProjectId,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [{ isOver }, drop] = useDrop(() => ({
    accept: [ItemTypes.SEARCH_HISTORY_ITEM, ItemTypes.PROJECT_QUERY],
    drop: async (item: { id: number }) => {
      try {
        await api.post(`/api/search-history/${item.id}/move/`, {
          project_id: null,
        });
        await updateSearchHistory();
        await updateProjectQueries();
      } catch (error) {
        console.error("Error moving item to search history:", error);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const handleAddToProject = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setProjectMenuAnchor(event.currentTarget);
  };

  const handleProjectSelect = async (projectId: number | null) => {
    if (projectId === null) {
      try {
        await api.post(`/api/search-history/${item.id}/move/`, {
          project_id: null,
        });
        console.log(`Successfully moved search ${item.id} to search history`);
      } catch (error) {
        console.error("Error moving query to search history:", error);
      }
    } else {
      try {
        await api.post(`/api/search-history/${item.id}/move/`, {
          project_id: projectId,
        });
        console.log(
          `Successfully added search ${item.id} to project ${projectId}`
        );
      } catch (error) {
        console.error("Error adding query to project:", error);
      }
    }

    await Promise.all([
      updateSearchHistory(),
      updateProjectQueries()
    ]);
    setProjectMenuAnchor(null);
  };


  const handleShare = (query: string) => {
    const shareUrl = `${window.location.origin}${
      AppRoutes.results
    }/?q=${encodeURIComponent(item.query_text)}`;
    navigator.clipboard.writeText(shareUrl);
  };

  const handleRerunSearch = async (query: string) => {
    await api.put(`/api/search-history/${item.id}/`, {});
    //await updateSearchHistory();
    //console.log("handleRerunSearch props:", { query });
    navigate(`${AppRoutes.results}/?q=${query}`, {
      state: {
        isManualSearch: true, // Set to true to force new search
        shouldSearch: true,
        searchQuery: query,
        overwriteCache: true, // New flag to indicate cache should be overwritten
      },
    });
  };

  const updateSearchHistoryOrder = (updatedItem: SearchHistoryItemType) => {
    setSearchHistory(prevHistory => {
      // Create new array with updated item at the front
      const filteredHistory = prevHistory.filter(item => item.id !== updatedItem.id);
      return [updatedItem, ...filteredHistory];
    });
  };

  const handleItemClick = async (query: string) => {
    try {
      const response = await api.put(`/api/search-history/${item.id}/`, {});

      const updatedItem = response.data;
      updateSearchHistoryOrder(updatedItem);

      navigate(`${AppRoutes.results}/?q=${query}`, {
        state: {
          isManualSearch: false,
          shouldSearch: false,
          searchQuery: query,
          overwriteCache: false,
        },
      });
    } catch (error) {
      console.error("Error updating search history order:", error);
    }
    
  };

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.4 : 1,
        cursor: "grab",
        backgroundColor: isOver ? colors.darkGray : colors.whiteGray,
        transition: "background-color 0.2s ease",
        borderRadius: 1,
        minHeight: "50px",
      }}
    >

      <SidebarItem
        id={item.id}
        title={item.custom_title || item.query_text}
        query_text={item.query_text}
        tooltipText={item.query_text}
        sidebarOpen={sidebarOpen}
        type="search"
        onClick={() => handleItemClick(item.query_text)}
        onRerun={handleRerunSearch}
        onRename={onRename}
        onDelete={onDelete}
        onShare={handleShare}
        onAddToProject={handleAddToProject}
      />

      <ProjectSelectMenu
        anchorEl={projectMenuAnchor}
        open={Boolean(projectMenuAnchor)}
        onClose={() => setProjectMenuAnchor(null)}
        onProjectSelect={handleProjectSelect}
        projects={projects}
        currentProjectId={currentProjectId}
        showSearchHistoryOption={currentProjectId !== null}
        onParentMenuClose={() => setMenuAnchorEl(null)}
      />
      {/* </> */}
    </div>
  );
};
