import React, { useState, useMemo } from "react";
import { colors } from "../../../styles/colors/Colors";
import {
  Box,
  Card,
  Chip,
  Typography,
  IconButton,
  Paper,
  Skeleton,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import Tooltip from "@mui/material/Tooltip";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import HelpIcon from "@mui/icons-material/Help";
import CheckCirlceIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

type AgreeMeterProps = {
  documents: Array<{
    agreeableness?: {
      agree?: number;
      disagree?: number;
      neutral?: number;
    };
  }>;
  isLoadingAgreeableness?: boolean;
};

export const AgreeMeter = ({
  documents,
  isLoadingAgreeableness,
}: AgreeMeterProps) => {
  const [showHighest, setShowHighest] = useState(false);

  const agreeablenessSum = useMemo(() => {
    const totals = documents.reduce(
      (acc, doc) => {
        if (!doc.agreeableness) return acc;
        return {
          agree: acc.agree + (doc.agreeableness.agree || 0),
          disagree: acc.disagree + (doc.agreeableness.disagree || 0),
          //neutral: acc.neutral + (doc.agreeableness.neutral || 0),
        };
      },
      { agree: 0, disagree: 0 } //neutral: 0 }
    );

    const total = totals.agree + totals.disagree; // + totals.neutral;
    return {
      agreePercent: Math.round((totals.agree / total) * 100),
      //neutralPercent: Math.round((totals.neutral / total) * 100),
      disagreePercent: Math.round((totals.disagree / total) * 100),
    };
  }, [documents]);

  const getMajorityCounts = () => {
    let agreeCount = 0;
    let disagreeCount = 0;
    let neutralCount = 0;
    let validDocuments = 0;

    documents.forEach((doc) => {
      if (!doc.agreeableness) return;
      validDocuments++;

      const { agree, disagree, neutral } = doc.agreeableness;
      const agreeValue = agree || 0;
      const disagreeValue = disagree || 0;
      const neutralValue = neutral || 0;

      if (agreeValue > disagreeValue) {
        // && agreeValue > neutralValue) {
        agreeCount += 1;
      } else if (disagreeValue > agreeValue) {
        // && disagreeValue > neutralValue) {
        disagreeCount += 1;
      } else if (agreeValue == disagreeValue) {
        neutralCount += 1;
      }
    });

    return {
      agree: agreeCount,
      disagree: disagreeCount,
      neutral: neutralCount,
      total: validDocuments,
    };
  };

  const getMajorityPercentage = (count: number, total: number) => {
    return total === 0 ? 0 : Math.round((count / total) * 100);
  };

  const majorityStats = getMajorityCounts();
  const majorityPercentages = {
    agree: getMajorityPercentage(majorityStats.agree, majorityStats.total),
    neutral: getMajorityPercentage(majorityStats.neutral, majorityStats.total),
    disagree: getMajorityPercentage(
      majorityStats.disagree,
      majorityStats.total
    ),
  };

  return (
    <Box
      sx={{
        marginTop: 2,
        marginBottom: 2,
        padding: 2,
        borderRadius: "20px",
        backgroundColor: colors.whiteGray,
      }}
    >
      {isLoadingAgreeableness ? (
        <>
          <Skeleton
            variant="text"
            width="50%"
            height={32}
            sx={{
              mb: 1,
              px: 2,
              bgcolor: colors.darkGray,
            }}
          />
          <Skeleton
            variant="text"
            width="100%"
            height={32}
            sx={{
              borderRadius: 4,
              bgcolor: colors.darkGray,
            }}
          />
        </>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              margin: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="h6" sx={{ color: "black" }}>
                {showHighest ? "Total Agreement" : "Agreement Distribution"}
              </Typography>
              <Tooltip
                title={
                  showHighest
                    ? "Shows how many documents predominantly support (yes) or contradict (no) the query based on their content."
                    : "Shows the percentage distribution of yes/no answers across all documents based on their content relevance to the query."
                }
                arrow
                componentsProps={{
                  tooltip: {
                    sx: {
                      color: colors.white,
                      backgroundColor: colors.darkGray,
                      fontSize: "15px",
                      padding: "12px 16px",
                      maxWidth: "400px",
                      lineHeight: "1.4",
                    },
                  },
                }}
              >
                <InfoIcon
                  sx={{
                    color: colors.darkGray,
                    fontSize: "1.1rem",
                    cursor: "help",
                    "&:hover": { color: colors.gray },
                  }}
                />
              </Tooltip>
            </Box>
            <IconButton
              onClick={() => setShowHighest(!showHighest)}
              sx={{
                color: "white",
                backgroundColor: colors.darkGray,
                "&:hover": { backgroundColor: colors.gray },
              }}
            >
              <SwapHorizIcon />
            </IconButton>
          </Box>
          <Box
            style={{
              display: "flex",
              width: "100%",
              gap: "4px",
            }}
          >
            {showHighest ? (
              <>
                {majorityPercentages.agree > 0 && (
                  <Chip
                    variant="filled"
                    icon={<CheckCirlceIcon />}
                    label={`${majorityStats.agree} Yes`}
                    size="small"
                    sx={{
                      flex: majorityPercentages.agree,
                      bgcolor: colors.green,
                      color: "#ebebeb",
                      fontWeight: "bold",
                      marginBottom: "16px",
                      "& .MuiChip-label": {
                        overflow: "visible",
                        whiteSpace: "nowrap",
                      },
                      "& .MuiChip-icon": { color: "#ebebeb" },
                    }}
                  />
                )}
                {majorityPercentages.neutral > 0 && (
                  <Chip
                    variant="filled"
                    icon={<HelpIcon />}
                    label={`${majorityStats.neutral} Neutral`}
                    size="small"
                    sx={{
                      flex: majorityPercentages.neutral,
                      bgcolor: "orange",
                      color: "#ebebeb",
                      fontWeight: "bold",
                      marginBottom: "16px",
                      "& .MuiChip-label": {
                        overflow: "visible",
                        whiteSpace: "nowrap",
                      },
                      "& .MuiChip-icon": { color: "#ebebeb" },
                    }}
                  />
                )}
                {majorityPercentages.disagree > 0 && (
                  <Chip
                    variant="filled"
                    icon={<CancelIcon />}
                    label={`${majorityStats.disagree} No`}
                    size="small"
                    sx={{
                      flex: majorityPercentages.disagree,
                      bgcolor: colors.red,
                      color: "#ebebeb",
                      fontWeight: "bold",
                      marginBottom: "16px",
                      "& .MuiChip-label": {
                        overflow: "visible",
                        whiteSpace: "nowrap",
                      },
                      "& .MuiChip-icon": { color: "#ebebeb" },
                    }}
                  />
                )}
              </>
            ) : (
              <>
                {agreeablenessSum.agreePercent > 0 && (
                  <Chip
                    variant="filled"
                    icon={<CheckCirlceIcon />}
                    label={`Yes ${agreeablenessSum.agreePercent}%`}
                    size="small"
                    sx={{
                      flex: agreeablenessSum.agreePercent,
                      bgcolor: colors.green,
                      color: "#ebebeb",
                      fontWeight: "bold",
                      marginBottom: "16px",
                      "& .MuiChip-label": {
                        overflow: "visible",
                        whiteSpace: "nowrap",
                      },
                      "& .MuiChip-icon": {
                        color: "#ebebeb",
                      },
                    }}
                  />
                )}
                {/* {agreeablenessSum.neutralPercent > 0 && (
                  <Chip
                    variant="filled"
                    icon={<HelpIcon />}
                    label={`Neutral ${agreeablenessSum.neutralPercent}%`}
                    size="small"
                    sx={{
                      flex: agreeablenessSum.neutralPercent,
                      bgcolor: "orange",
                      color: "#ebebeb",
                      fontWeight: "bold",
                      marginBottom: "16px",
                      "& .MuiChip-label": {
                        overflow: "visible",
                        whiteSpace: "nowrap",
                      },
                      "& .MuiChip-icon": {
                        color: "#ebebeb",
                      },
                    }}
                  />
                )} */}
                {agreeablenessSum.disagreePercent > 0 && (
                  <Chip
                    variant="filled"
                    icon={<CancelIcon />}
                    label={`No ${agreeablenessSum.disagreePercent}%`}
                    size="small"
                    sx={{
                      flex: agreeablenessSum.disagreePercent,
                      bgcolor: colors.red,
                      color: "#ebebeb",
                      fontWeight: "bold",
                      marginBottom: "16px",
                      "& .MuiChip-label": {
                        overflow: "visible",
                        whiteSpace: "nowrap",
                      },
                      "& .MuiChip-icon": {
                        color: "#ebebeb",
                      },
                    }}
                  />
                )}
              </>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};
