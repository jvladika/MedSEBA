import React from "react";
import { Typography, Box, Tooltip, Chip } from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import { memo } from "react";

interface CitationChipProps {
  number: string;
  title: string;
  pmid: string;
  citations: number;
  summary?: string;
}

export const CitationChip = memo(
  ({ number, pmid, title, citations, summary }: CitationChipProps) => {
    return (
      <Tooltip
        title={
          <>
            <Typography sx={{ fontSize: "15px", fontWeight: "bold" }}>
              {title}
            </Typography>
            {summary && (
              <Typography sx={{ fontSize: "13px", mt: 1 }}>
                {summary}
              </Typography>
            )}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mt: 0.5,
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{ fontSize: "13px" }}>
                {citations} citations
              </Typography>
              <LaunchIcon sx={{ fontSize: 16 }} />
            </Box>
          </>
        }
        arrow
      >
        <Chip
          label={`[${number}]`}
          data-pmid={pmid}
          sx={{
            height: "20px",
            backgroundColor: "transparent",
            color: "white",
            cursor: "pointer",
            border: "none",
            "& .MuiChip-label": {
              padding: 0,
            },
          }}
          variant="outlined"
          size="small"
        />
      </Tooltip>
    );
  }
);
