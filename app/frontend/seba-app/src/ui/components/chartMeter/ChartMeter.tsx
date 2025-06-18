import { useState, useMemo } from "react";
import { colors } from "../../../styles/colors/Colors";
import {
  Box,
  Card,
  Collapse,
  Typography,
  IconButton,
  Tooltip as MuiTooltip,
  Paper,
  Skeleton,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ScatterChart,
  Scatter,
  Tooltip,
} from "recharts";

type ChartMeterProps = {
  documents: Array<{
    pmid?: string;
    title?: string;
    publicationDate?: string;
    citations?: {
      total?: number;
    };
    agreeableness?: {
      agree?: number;
      disagree?: number;
      neutral?: number;
    };
  }>;
  isLoadingAgreeableness?: boolean;
  agreeableness?: {
    agree?: number;
    disagree?: number;
    neutral?: number;
  };
  documentOrderMap: Map<string, number>;
};

type ViewType = "distribution" | "majority" | "citations";

export const ChartMeter = ({
  documents,
  isLoadingAgreeableness,
  documentOrderMap,
  agreeableness,
}: ChartMeterProps) => {
  const [viewType, setViewType] = useState<ViewType>("distribution");
  const [expanded, setExpanded] = useState(true);

  const { citationData, yearlyData } = useMemo(() => {
    const citationData = documents
      .filter((doc) => doc.agreeableness && doc.citations?.total)
      .map((doc) => {
        const {
          agree = 0,
          disagree = 0,
          neutral = 0,
        } = doc.agreeableness || {};
        const majorityType =
          agree > disagree && agree > neutral
            ? "agree"
            : disagree > agree && disagree > neutral
            ? "disagree"
            : "neutral";

        return {
          year: doc.publicationDate?.split("-")[0] || "Unknown",
          citations: doc.citations?.total || 0,
          majorityType,
          title: doc.title || "Undefined",
          pmid: doc.pmid,
        };
      });

    const yearlyData = new Map<
      number,
      {
        agree: number;
        disagree: number;
        neutral: number;
        total: number;
        majorityAgree: number;
        majorityDisagree: number;
        majorityNeutral: number;
      }
    >();

    documents.forEach((doc) => {
      const year = parseInt(doc.publicationDate?.split("-")[0] || "0");
      if (year === 0) return;

      const current = yearlyData.get(year) || {
        agree: 0,
        disagree: 0,
        neutral: 0,
        total: 0,
        majorityAgree: 0,
        majorityDisagree: 0,
        majorityNeutral: 0,
      };

      if (doc.agreeableness) {
        const { agree, disagree, neutral } = doc.agreeableness;

        // Distribution data
        current.agree += agree || 0;
        current.disagree += disagree || 0;
        current.neutral += neutral || 0;
        current.total += 1;

        // Majority data
        const agreeValue = agree || 0;
        const disagreeValue = disagree || 0;
        const neutralValue = neutral || 0;

        if (agreeValue > disagreeValue && agreeValue > neutralValue) {
          current.majorityAgree += 1;
        } else if (disagreeValue > agreeValue && disagreeValue > neutralValue) {
          current.majorityDisagree += 1;
        } else if (
          neutralValue >= agreeValue &&
          neutralValue >= disagreeValue
        ) {
          current.majorityNeutral += 1;
        }
      }

      yearlyData.set(year, current);
    });

    const data = Array.from(yearlyData.entries())
      .map(([year, stats]) => {
        const totalPercentage = stats.agree + stats.disagree + stats.neutral;

        // Calculate exact percentages first
        const exactAgreePercent = (stats.agree / totalPercentage) * 100;
        const exactNeutralPercent = (stats.neutral / totalPercentage) * 100;
        const exactDisagreePercent = (stats.disagree / totalPercentage) * 100;

        // Floor all percentages first
        let agreePercent = Math.floor(exactAgreePercent);
        let neutralPercent = Math.floor(exactNeutralPercent);
        let disagreePercent = Math.floor(exactDisagreePercent);

        // Calculate remainder
        const remainder =
          100 - (agreePercent + neutralPercent + disagreePercent);

        // Distribute remainder to largest decimal
        const decimals = [
          { type: "agree", value: exactAgreePercent - agreePercent },
          { type: "neutral", value: exactNeutralPercent - neutralPercent },
          { type: "disagree", value: exactDisagreePercent - disagreePercent },
        ].sort((a, b) => b.value - a.value);

        // Add remainder to highest decimal
        if (decimals[0].type === "agree") agreePercent += remainder;
        else if (decimals[0].type === "neutral") neutralPercent += remainder;
        else disagreePercent += remainder;

        return {
          year: year.toString(),
          agreePercent,
          neutralPercent,
          disagreePercent,
          // Majority data
          majorityAgree: stats.majorityAgree,
          majorityNeutral: stats.majorityNeutral,
          majorityDisagree: stats.majorityDisagree,
        };
      })
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
    return { citationData, yearlyData: data };
  }, [documents]);

  const handleScatterClick = (data: any) => {
    console.log("Raw click data:", data);
    const pmid = data?.payload?.pmid;

    if (pmid) {
      const position = documentOrderMap.get(pmid);
      if (position) {
        const element = document.getElementById(`document-${position}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  return (
    <Box
      style={{
        marginTop: 2,
        marginBottom: 2,
        padding: 2,
        borderRadius: "20px",
        backgroundColor: colors.whiteGray,
      }}
    >
      {isLoadingAgreeableness ? (
        <>
          <Box sx={{ width: "100%", p: 2, mb: 2 }}>
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
              height={100}
              sx={{
                borderRadius: 4,
                bgcolor: colors.darkGray,
              }}
            />
          </Box>
        </>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              margin: 1,
              px: 2,
            }}
          >
            <Typography variant="h6" sx={{ color: "black", paddingLeft: 2 }}>
              Document Statistics
            </Typography>
            <IconButton
              onClick={() => setExpanded(!expanded)}
              sx={{ color: "black" }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                margin: 1,
                px: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ color: "black" }}>
                  {viewType === "majority"
                    ? "Total Agreement by Year"
                    : viewType === "citations"
                    ? "Citation Count by Agreement"
                    : "Agreement Distribution by Year"}
                </Typography>
                <MuiTooltip
                  title={
                    viewType === "majority"
                      ? "Shows the total number of documents that predominantly agree or disagree with the query for each year."
                      : viewType === "citations"
                      ? "Displays how citations are distributed across documents with different agreement levels."
                      : "Shows the percentage distribution of agreement levels for documents by year."
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
                </MuiTooltip>
              </Box>
              <IconButton
                onClick={() =>
                  setViewType((current) =>
                    current === "majority"
                      ? "citations"
                      : current === "citations"
                      ? "distribution"
                      : "majority"
                  )
                }
                sx={{
                  color: "white",
                  backgroundColor: colors.darkGray,
                  "&:hover": { backgroundColor: colors.gray },
                }}
              >
                <SwapHorizIcon />
              </IconButton>
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              {viewType === "citations" ? (
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Year"
                    domain={["auto", "auto"]}
                    stroke="#black"
                    tick={{ fill: "#black" }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Citations"
                    stroke="#black"
                    tick={{ fill: "#black" }}
                  />
                  {/* <Tooltip
                    contentStyle={{
                      backgroundColor: colors.darkGray,
                      border: "none",
                    }}
                    itemStyle={{ color: colors.white }}
                    labelStyle={{ color: colors.white }}
                    cursor={{ strokeDasharray: "3 3" }}
                  /> */}
                  <Legend />
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <Box
                            sx={{
                              backgroundColor: colors.darkGray,
                              padding: "8px 12px",
                              borderRadius: "4px",
                              maxWidth: "300px",
                              textAlign: "left",
                            }}
                          >
                            <Typography
                              sx={{
                                color: colors.white,
                                fontSize: "16px",
                                fontWeight: "bold",
                              }}
                            >
                              {data.title}
                            </Typography>
                            <Typography
                              sx={{ color: colors.white, fontSize: "15px" }}
                            >
                              Year: {data.year}
                            </Typography>
                            <Typography
                              sx={{ color: colors.white, fontSize: "15px" }}
                            >
                              Citations: {data.y}
                            </Typography>
                          </Box>
                        );
                      }
                      return null;
                    }}
                    cursor={{ strokeDasharray: "3 3" }}
                  />
                  <Scatter
                    name="Yes"
                    data={citationData
                      .filter((d) => d.majorityType === "agree")
                      .map((d) => ({
                        x: parseInt(d.year),
                        y: d.citations,
                        title: d.title,
                        year: d.year,
                        pmid: d.pmid,
                      }))}
                    fill={colors.green}
                    shape="circle"
                    cursor="pointer"
                    onClick={(data) => handleScatterClick(data)}
                  />
                  {/* <Scatter
                    name="Neutral"
                    data={citationData
                      .filter((d) => d.majorityType === "neutral")
                      .map((d) => ({
                        x: parseInt(d.year), // Convert year to number
                        y: d.citations,
                        // title: d.title,
                        // year: d.year,
                        // citations: d.citations,
                      }))}
                    fill="orange"
                    shape="circle"
                  /> */}
                  <Scatter
                    name="No"
                    data={citationData
                      .filter((d) => d.majorityType === "disagree")
                      .map((d) => ({
                        x: parseInt(d.year),
                        y: d.citations,
                        title: d.title,
                        year: d.year,
                        pmid: d.pmid,
                      }))}
                    fill={colors.red}
                    shape="circle"
                    cursor="pointer"
                    onClick={(data) => handleScatterClick(data)}
                  />
                </ScatterChart>
              ) : (
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                  <XAxis
                    dataKey="year"
                    stroke="#black"
                    tick={{ fill: "#black" }}
                  />
                  <YAxis
                    stroke="#black"
                    tick={{ fill: "#black" }}
                    label={{
                      value:
                        viewType === "majority" ? "Total Amount" : "Percentage",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#black",
                    }}
                    domain={viewType === "majority" ? [0, "auto"] : [0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.darkGray,
                      border: "none",
                    }}
                    itemStyle={{ color: colors.white }}
                    labelStyle={{ color: colors.white }}
                  />
                  <Legend />
                  {viewType === "majority" ? (
                    <>
                      <Bar
                        dataKey="majorityAgree"
                        stackId="a"
                        fill={colors.green}
                        name="Yes"
                      />
                      {/* <Bar
                        dataKey="majorityNeutral"
                        stackId="a"
                        fill="orange"
                        name="Neutral"
                      /> */}
                      <Bar
                        dataKey="majorityDisagree"
                        stackId="a"
                        fill={colors.red}
                        name="No"
                      />
                    </>
                  ) : (
                    <>
                      <Bar
                        dataKey="agreePercent"
                        stackId="a"
                        fill={colors.green}
                        name="Yes"
                      />
                      {/* <Bar
                        dataKey="neutralPercent"
                        stackId="a"
                        fill="orange"
                        name="Neutral"
                      /> */}
                      <Bar
                        dataKey="disagreePercent"
                        stackId="a"
                        fill={colors.red}
                        name="No"
                      />
                    </>
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </Collapse>
        </>
      )}
    </Box>
  );
};
