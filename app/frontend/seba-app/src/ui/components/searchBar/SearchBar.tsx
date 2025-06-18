import { colors } from "../../../styles/colors/Colors";
import { InputBase, TextField } from "@mui/material";
import React, { useState, useEffect } from "react";
import { IconButton } from "@mui/material";
import { Paper, Badge } from "@mui/material";
import { CircularProgress } from "@mui/material";
import { Send, StopCircle } from "@mui/icons-material";
import { FilterList } from "@mui/icons-material";
import { SearchFilterModal } from "../searchFilterModal/SearchFilterModal";

interface SearchBarProps {
  onSearch: (query: string, isManual: boolean) => void;
  onAbort?: () => void;
  searchItem?: string;
  isLoading?: boolean;
  isAborting?: boolean;
  isLocked?: boolean;
  hasActiveFilters?: boolean;
  onOpenFilters: () => void;
}

export const SearchBar = ({
  onSearch,
  onAbort,
  searchItem = "",
  isLoading = false,
  isAborting = false,
  onOpenFilters,
  hasActiveFilters,
}: SearchBarProps) => {
  const [query, setQuery] = useState(searchItem);

  useEffect(() => {
    setQuery(searchItem);
  }, [searchItem]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (query.trim()) {
      onSearch(query, true); // true indicates manual search
    }
  };

  const handleButtonClick = (event: React.MouseEvent) => {
    event.preventDefault();
    if (isLoading) {
      onAbort?.();
    } else {
      handleSubmit(event as any);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (query.trim()) {
        onSearch(query, true);
      }
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={16}
        sx={{
          width: "100%",
          maxWidth: "1200px",
          display: "flex",
          minHeight: "30px",
          padding: 0.5,
          backgroundColor: colors.white,
          borderRadius: "20px",
        }}
      >
        <InputBase
          fullWidth
          multiline
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          sx={{
            color: "black",
            minHeight: "2px",
            flex: 1,
            pl: 2,
            "& input": {
              padding: "8px 12px",
              borderRadius: "8px",
            },
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <IconButton
            onClick={onOpenFilters}
            sx={{
              color: hasActiveFilters ? colors.mainColor : colors.black,
              "&:hover": {
                color: colors.gray,
                backgroundColor: colors.white,
              },
            }}
          >
            <FilterList>Filter</FilterList>
          </IconButton>
          <IconButton
            type="button"
            onClick={handleButtonClick}
            sx={{
              padding: "4px",
              color: "white",
              "&:hover": {
                color: colors.gray,
                backgroundColor: colors.transparent,
              },
              "& .MuiSvgIcon-root": {
                fontSize: "20px",
              },
            }}
            aria-label={isLoading ? "stop search" : "search"}
          >
            {isLoading ? (
              isAborting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <StopCircle sx={{ color: "#d32f2f" }} />
              )
            ) : (
              <Send
                sx={{
                  color: "black",
                  "&:hover": {
                    color: colors.gray,
                    backgroundColor: colors.transparent,
                  },
                }}
              />
            )}
          </IconButton>
        </div>
      </Paper>
    </div>
  );
};
