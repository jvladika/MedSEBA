import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  TextField,
  CircularProgress,
  List,
  ListItem,
  Typography,
  Button,
  ListSubheader
} from "@mui/material";
import { useDrop } from "react-dnd";
import { ItemTypes } from "../../types";
import { SearchHistoryItem } from "./SearchHistoryItem";
import { useNavigate } from "react-router-dom";
import { SearchHistoryItemType } from "../../types";
import api from "../../../../../api";
import { AppRoutes } from "../../../../../navigation/constants/Routes";
import { style } from "../../../../../styles";
//import { useProjects } from "../../hooks/useProjects";
import { useSidebar } from "../../../../../context/SidebarContext";
import { colors } from "../../../../../styles/colors/Colors";
import { color } from "d3";

interface SearchHistorySectionProps {
  sidebarOpen: boolean;
  isAuthenticated: boolean;
}

export const SearchHistorySection = ({
  sidebarOpen,
  isAuthenticated,
}: SearchHistorySectionProps) => {
  const { searchHistory, projects, setSearchHistory, updateSearchHistory, updateProjectQueries } =
    useSidebar();
  const [filteredHistory, setFilteredHistory] = useState<
    SearchHistoryItemType[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterTerm, setFilterTerm] = useState("");
  const navigate = useNavigate();

  const [{ isOver }, drop] = useDrop(() => ({
    accept: [ItemTypes.PROJECT_QUERY, ItemTypes.SEARCH_HISTORY_ITEM],
    drop: async (item: { id: number }) => {
      try {
        await api.post(`/api/search-history/${item.id}/move/`, {
          project_id: null,
        });
        // Update frontend states concurrently
        await Promise.all([updateSearchHistory(), updateProjectQueries()]);
      } catch (error) {
        console.error("Error moving item to search history:", error);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterTerm(e.target.value);
  };

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      updateSearchHistory();
    }
  }, [isAuthenticated]);


  // Filter logic
  useEffect(() => {
    const filtered = searchHistory.filter((item) => {
      const term = filterTerm.toLowerCase();
      return (
        item.custom_title?.toLowerCase().includes(term) ||
        item.query_text.toLowerCase().includes(term)
      );
    });
    setFilteredHistory(filtered);
  }, [searchHistory, filterTerm]);


  const handleRename = async (itemId: number, newTitle: string) => {
    try {
      const response = await api.put(`/api/search-history/${itemId}/`, {
        custom_title: newTitle,
      });
      
      const updatedItem = response.data;
  
      // Update searchHistory in SidebarContext
      setSearchHistory((prev) => 
        prev.map((item) => 
          item.id === itemId ? { ...item, custom_title: newTitle } : item
        )
      );
  
      // Update filteredHistory state
      setFilteredHistory((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, custom_title: newTitle } : item
        )
      );
    } catch (error) {
      console.error("Error updating title:", error);
    }
  };


  const handleDelete = async (itemId: number) => {
    try {
      await api.delete(`/api/search-history/${itemId}/delete/`);
      await updateSearchHistory();
    } catch (error) {
      console.error("Error deleting search history item:", error);
    }
  };

  const groupSearchHistoryByDate = (history: SearchHistoryItemType[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setDate(lastMonth.getDate() - 30);

    return history.reduce((groups, item) => {
      // Use the more recent timestamp between created_at and updated_at
      const itemDate = new Date(
        new Date(item.updated_at) > new Date(item.created_at)
          ? item.updated_at
          : item.created_at
      );

      if (itemDate >= today) {
        if (!groups.today) groups.today = [];
        groups.today.push(item);
      } else if (itemDate >= yesterday) {
        if (!groups.yesterday) groups.yesterday = [];
        groups.yesterday.push(item);
      } else if (itemDate >= lastWeek) {
        if (!groups.lastWeek) groups.lastWeek = [];
        groups.lastWeek.push(item);
      } else if (itemDate >= lastMonth) {
        if (!groups.lastMonth) groups.lastMonth = [];
        groups.lastMonth.push(item);
      } else {
        if (!groups.older) groups.older = [];
        groups.older.push(item);
      }
      return groups;
    }, {} as Record<string, SearchHistoryItemType[]>);
  };

  const groupedHistory = useMemo(
    () => groupSearchHistoryByDate(filteredHistory),
    [filteredHistory]
  );

  return (
    <Box
      ref={drop}
      sx={{
        backgroundColor: isOver ? colors.lightGray : "transparent",
        transition: "background-color 0.2s ease",
      }}
    >

      {/* Header */}
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
          padding: "15px 12px",
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
          History
        </Typography>
      </ListSubheader>

      {/* Search Bar */}
      {isAuthenticated && sidebarOpen && searchHistory.length > 0 && (
        <Box
          sx={{
            p: 2,
            position: "sticky",
            top: 115,
            zIndex: 1,
            backgroundColor: colors.whiteGray,
          }}
        >
          <TextField
            size="small"
            placeholder="Search history..."
            value={filterTerm}
            onChange={handleSearchChange}
            fullWidth
            sx={{
              "& .MuiInputBase-input": {
                color: colors.black,
                fontSize: "0.875rem",
              },
              "& .MuiOutlinedInput-root": {
                backgroundColor: colors.whiteGray,
                borderRadius: "10px",
                "& fieldset": {
                  borderColor: `${colors.gray}`,
                },
                "&:hover fieldset": {
                  borderColor: `${colors.black}`,
                },
                "&.Mui-focused fieldset": {
                  borderColor: `${colors.black}`,
                }
              },
            }}
          />
        </Box>
      )}

      {/* Search History List */}
      <List sx={{ color: colors.black }}>
        {!isAuthenticated ? (
          <Box sx={{ padding: 2, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: colors.black }}>
              Please log in to view your search history
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
              <Button
                variant="contained" 
                disableRipple
                size="small"
                onClick={() => navigate("/login")}
                sx={{
                  backgroundColor: colors.mainColorHover,
                  color: 'white',
                  borderRadius: '10px',
                  padding: '6px 24px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: colors.mainColor,
                  },
                }}
              >
                Login
              </Button>
            </ListItem>
          </Box>
        ) : isLoading ? (
          <ListItem sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={24} sx={{ color: colors.black }} />
          </ListItem>
        ) : !Array.isArray(filteredHistory) || searchHistory.length === 0 ? (
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
              No search history yet
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                color: colors.darkGray,
              }}
            >
              Ask a question to get started!
            </Typography>
          </Box>
        ) : Object.keys(groupedHistory).length === 0 && filterTerm ? (
          <Box sx={{ padding: 2, textAlign: 'center' }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.875rem',
                lineHeight: 1.5,
              }}
            >
              No results found for "{filterTerm}"
            </Typography>
          </Box>
        ) : (
          Object.entries(groupedHistory).map(([period, items]) => (
            <React.Fragment key={period}>
              <ListItem>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: colors.black,
                    textTransform: "uppercase",
                    fontSize: "0.875rem",
                    fontWeight: "bold",
                    py: 1,
                  }}
                >
                  {period === "today" && "Today"}
                  {period === "yesterday" && "Yesterday"}
                  {period === "lastWeek" && "Last 7 Days"}
                  {period === "lastMonth" && "This Month"}
                  {period === "older" && "Older"}
                </Typography>
              </ListItem>
              {items.map((item) => (
                <SearchHistoryItem
                  key={item.id}
                  item={item}
                  sidebarOpen={sidebarOpen}
                  onRename={handleRename}
                  onDelete={handleDelete}
                  currentProjectId={null}
                  projects={projects}
                />
              ))}
            </React.Fragment>
          ))
        )}
      </List>
    </Box>
  );
};
