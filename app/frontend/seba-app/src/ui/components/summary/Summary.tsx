import React, { ReactNode } from "react";
import { colors } from "../../../styles/colors/Colors";
import { Card, Typography, Box, Skeleton } from "@mui/material";

interface SummaryProps {
  summary: string | ReactNode;
  isLoadingSummary?: boolean;
  documents?: Document[];
}

const Summary: React.FC<SummaryProps> = ({ summary, isLoadingSummary }) => {
  return (
    <Box
      sx={{
        marginTop: 4,
        marginBottom: 0.5,
        padding: 2,
        borderRadius: "20px",
        backgroundColor: colors.whiteGray,
      }}
    >
      {isLoadingSummary ? (
        <Skeleton
          variant="text"
          width="100%"
          height={200}
          sx={{ bgcolor: colors.darkGray }}
        ></Skeleton>
      ) : (
        <>
          <Typography
            style={{
              whiteSpace: "pre-line",
              lineHeight: "1.6",
              color: "black",
              textAlign: "left",
            }}
          >
            {summary}
          </Typography>
        </>
      )}
    </Box>
  );
};

export default Summary;
