import React, { useEffect, useState } from "react";
import { colors } from "../../../styles/colors/Colors";
import { TextEllipsis } from "./textEllipsis/TextEllipsis";
import { IconAssets } from "../../../resources/icons/IconAssets";
import { Icon } from "../icon/Icon";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HelpIcon from "@mui/icons-material/Help";
import LaunchIcon from "@mui/icons-material/Launch";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import {
  Card,
  Typography,
  Divider,
  CardContent,
  Chip,
  Button,
  Avatar,
  Tooltip,
  Skeleton,
  Box,
  CircularProgress,
} from "@mui/material";
import { Collapse, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { useNavigate } from "react-router-dom";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
import BookmarkService from "../../../data/services/BookmarkService";
import CommentService from "../../../data/services/CommentService";
import FullDocumentService from "../../../data/services/FullDocumentService";
import { useSnackbar } from "notistack";
import { mapToFullDocument } from "../../../data/utils/MapToFullDocument";
import { FullDocument } from "../../../data/models/FullDocument";
import { useAuth } from "../../../context/AuthContext";

interface PaperTileProps {
  pmid?: string;
  title?: string;
  abstract?: string;
  publicationDate?: string;
  query: string;
  aiSummary: string;
  isLoadingDocuments?: boolean;
  isLoadingAgreeableness?: boolean;
  relevantSection?: {
    mostRelevantSentence?: string;
    similarityScore?: number;
  };
  citations?: {
    total?: number;
  };
  agreeableness?: {
    agree?: number;
    disagree?: number;
    neutral?: number;
    entailmentModel?: string;
  };
  orderNumber?: number;
  showAgreeButton?: boolean;
  showAISummary?: boolean;
  showRelevantSection?: boolean;
}

const findBestMatchingSentence = (
  sentences: string[],
  targetSentence: string
): number => {
  const targetWords = new Set(
    targetSentence.toLowerCase().split(/\s+/).filter(Boolean)
  );

  let bestIndex = -1;
  let bestMatchCount = 0;

  sentences.forEach((sentence, index) => {
    const sentenceWords = new Set(
      sentence.toLowerCase().split(/\s+/).filter(Boolean)
    );
    const matchCount = Array.from(targetWords).filter((word) =>
      sentenceWords.has(word)
    ).length;
    if (matchCount > bestMatchCount) {
      bestMatchCount = matchCount;
      bestIndex = index;
    }
  });

  return bestMatchCount >= targetWords.size * 0.5 ? bestIndex : -1;
};

const getContextAroundSentence = (
  abstract: string,
  relevantSentence: string,
  contextSentences: number = 1
): { before: string; sentence: string; after: string } => {
  const sentences = abstract
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .filter((s) => s.trim());

  const sentenceIndex = findBestMatchingSentence(sentences, relevantSentence);

  if (sentenceIndex === -1) {
    return {
      before: "",
      sentence: relevantSentence,
      after: "",
    };
  }

  const beforeSentences = sentences
    .slice(Math.max(0, sentenceIndex - contextSentences), sentenceIndex)
    .join(" ");
  const afterSentences = sentences
    .slice(
      sentenceIndex + 1,
      Math.min(sentenceIndex + 1 + contextSentences, sentences.length)
    )
    .join(" ");

  return {
    before: beforeSentences,
    sentence: sentences[sentenceIndex],
    after: afterSentences,
  };
};

export const PaperTile: React.FC<PaperTileProps> = ({
  pmid,
  title,
  abstract,
  publicationDate,
  query,
  aiSummary,
  relevantSection,
  citations,
  agreeableness,
  orderNumber,
  isLoadingDocuments,
  isLoadingAgreeableness,
  showAgreeButton = true,
  showAISummary = true,
  showRelevantSection = true,
}) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [fullDocument, setFullDocument] = useState<FullDocument>(() =>
    mapToFullDocument({
      pmid,
      title,
      abstract,
      publicationDate,
      relevantSection: relevantSection as any,
      citations: citations as any,
      agreeableness,
    })
  );

  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const documentService = new FullDocumentService();

    if (pmid) {
      documentService.getDocumentByPmid(pmid, (response) => {
        const existingDoc = (response as any).document;
        if (existingDoc?.document_id) {
          setFullDocument((prev) => ({
            ...prev,
            document_id: existingDoc.document_id,
          }));
          setIsBookmarked(true);
        }
      });
    }
  }, [pmid]);

  const handleBookmarkToggle = () => {
    setIsBookmarkLoading(true); // Set loading state immediately
    const documentService = new FullDocumentService();
    const bookmarkService = new BookmarkService();
    const commentService = new CommentService();

    if (!isBookmarked) {
      if (!fullDocument.document_id) {
        documentService.createDocument(fullDocument, (response) => {
          const savedDoc = (response as any).document;
          if (savedDoc?.document_id) {
            setFullDocument((prev) => ({
              ...prev,
              document_id: savedDoc.document_id,
            }));
            bookmarkService.createBookmark(savedDoc.document_id, () => {
              setIsBookmarked(true);
              setIsBookmarkLoading(false); // Reset loading state after operation
              enqueueSnackbar("Document saved to bookmarks", {
                variant: "success",
                autoHideDuration: 2000,
                anchorOrigin: { vertical: "top", horizontal: "center" },
              });
            });
          }
        });
      } else {
        bookmarkService.createBookmark(fullDocument.document_id, () => {
          setIsBookmarked(true);
          setIsBookmarkLoading(false); // Reset loading state after operation
          enqueueSnackbar("Document saved to bookmarks", {
            variant: "success",
            autoHideDuration: 2000,
            anchorOrigin: { vertical: "top", horizontal: "center" },
          });
        });
      }
    } else {
      if (!fullDocument.document_id) {
        console.error("No document_id found for bookmarked document");
        setIsBookmarkLoading(false); // Reset loading state on error
        return;
      }
      commentService.deleteAllComments(fullDocument.document_id || "", () => {
        bookmarkService.deleteBookmark(fullDocument.document_id || "", () => {
          documentService.deleteDocument(fullDocument.document_id || "", () => {
            setIsBookmarked(false);
            setIsBookmarkLoading(false); // Reset loading state after operation
            enqueueSnackbar("Document removed from bookmarks", {
              variant: "info",
              autoHideDuration: 2000,
              anchorOrigin: { vertical: "top", horizontal: "center" },
            });
          });
        });
      });
    }
  };

  const context = getContextAroundSentence(
    abstract || "",
    relevantSection?.mostRelevantSentence || "",
    1
  );

  const getHighestAgreement = (
    agreeableness: PaperTileProps["agreeableness"]
  ) => {
    if (!agreeableness) return null;

    const agree = agreeableness.agree || 0;
    const disagree = agreeableness.disagree || 0;

    // Return neutral if agree and disagree are equal
    if (agree === disagree) {
      return "neutral";
    }

    const scores = [
      { label: "agree", value: agree, priority: 1 },
      { label: "disagree", value: disagree, priority: 2 },
    ];

    const highest = scores.sort((a, b) => {
      if (b.value !== a.value) {
        return b.value - a.value;
      }
      return b.priority - a.priority;
    })[0];

    return highest.label;
  };

  const calculatePercentages = (
    agreeableness: PaperTileProps["agreeableness"]
  ) => {
    if (!agreeableness) return { agree: 0, disagree: 0, neutral: 0 };
    const total =
      (agreeableness.agree || 0) +
      (agreeableness.disagree || 0) +
      (agreeableness.neutral || 0);
    return {
      agree: Math.round(((agreeableness.agree || 0) / total) * 100),
      disagree: Math.round(((agreeableness.disagree || 0) / total) * 100),
      neutral: Math.round(((agreeableness.neutral || 0) / total) * 100),
    };
  };

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "90px",
        marginBottom: "24px",
        padding: "15px",
        backgroundColor: colors.whiteGray,
        textAlign: "left",
        borderRadius: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {isLoadingDocuments ? (
        <Box sx={{ width: "100%", p: 2 }}>
          <Skeleton
            variant="text"
            height={50}
            sx={{ bgcolor: colors.darkGray }}
          />
        </Box>
      ) : (
        <>
          <Typography
            sx={{
              display: "grid",
              gridTemplateColumns:
                "40px minmax(200px, 1fr) 130px 60px 40px 40px",
              gap: "16px",
              alignItems: "center",
              fontWeight: "bold",
              width: "100%",
              m: 0,
              lineHeight: 1,
              color: "black",
              marginBottom: "16px",
            }}
          >
            <Avatar
              sx={{
                bgcolor: colors.darkGray,
                color: "white",
                width: 32,
                height: 32,
                fontSize: "0.8125rem",
              }}
            >
              {orderNumber}
            </Avatar>
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </span>
            {isLoadingAgreeableness ? (
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Skeleton
                  variant="rectangular"
                  width={90}
                  height={24}
                  sx={{
                    borderRadius: 4,
                    bgcolor: colors.darkGray,
                  }}
                />
                <Skeleton
                  variant="rectangular"
                  width={80}
                  height={24}
                  sx={{
                    borderRadius: 4,
                    bgcolor: colors.darkGray,
                  }}
                />
              </Box>
            ) : (
              <>
                {aiSummary ? (
                  <span>
                    <Tooltip
                      componentsProps={{
                        tooltip: {
                          sx: {
                            backgroundColor: colors.darkGray,
                          },
                        },
                      }}
                      title={
                        <Typography
                          sx={{ fontSize: "14px", fontWeight: "bold" }}
                        >
                          {aiSummary}
                        </Typography>
                      }
                      arrow
                    >
                      <Chip
                        icon={<AutoAwesomeIcon></AutoAwesomeIcon>}
                        label="AI Summary"
                        size="small"
                        sx={{
                          height: "24px",
                          backgroundColor: colors.darkGray,
                          color: colors.white,
                          "& .MuiChip-icon": {
                            color: colors.white,
                            ml: "8px",
                          },
                          ml: 1,
                        }}
                      />
                    </Tooltip>
                  </span>
                ) : null}
                <span
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {agreeableness &&
                    (agreeableness.agree ||
                      agreeableness.disagree ||
                      agreeableness.neutral) && (
                      <>
                        {getHighestAgreement(agreeableness) === "agree" && (
                          <Tooltip
                            componentsProps={{
                              tooltip: {
                                sx: {
                                  backgroundColor: colors.darkGray,
                                },
                              },
                            }}
                            title={
                              <Box sx={{ p: 1 }}>
                                <Typography
                                  fontSize={"14px"}
                                  fontWeight={"bold"}
                                >
                                  This paper tends to answer your question with{" "}
                                  <Chip
                                    icon={<CheckCircleIcon />}
                                    label={"Yes"}
                                    size="small"
                                    sx={{
                                      bgcolor: colors.green,
                                      color: colors.white,
                                      "& .MuiChip-icon": {
                                        color: colors.white,
                                      },
                                    }}
                                  />
                                  .
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 1,
                                    alignItems: "center",
                                    pt: "12px",
                                  }}
                                >
                                  <Chip
                                    icon={<CheckCircleIcon />}
                                    label={`${agreeableness?.agree || 0}%`}
                                    size="small"
                                    sx={{
                                      bgcolor: colors.green,
                                      color: colors.white,
                                      "& .MuiChip-icon": {
                                        color: colors.white,
                                      },
                                    }}
                                  />
                                  {/* <Chip
                                    icon={<HelpIcon />}
                                    label={`${agreeableness?.neutral || 0}%`}
                                    size="small"
                                    sx={{
                                      bgcolor: "orange",
                                      color: colors.white,
                                      "& .MuiChip-icon": {
                                        color: colors.white,
                                      },
                                    }}
                                  /> */}
                                  <Chip
                                    icon={<CancelIcon />}
                                    label={`${agreeableness?.disagree || 0}%`}
                                    size="small"
                                    sx={{
                                      bgcolor: colors.red,
                                      color: colors.white,
                                      "& .MuiChip-icon": {
                                        color: colors.white,
                                      },
                                    }}
                                  />
                                </Box>
                              </Box>
                            }
                            arrow
                          >
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Yes"
                              size="small"
                              sx={{
                                bgcolor: colors.green,
                                color: colors.white,
                                minWidth: "80px",
                                "& .MuiChip-label": {
                                  overflow: "visible",
                                  whiteSpace: "nowrap",
                                },
                                "& .MuiChip-icon": {
                                  color: colors.white,
                                },
                              }}
                            />
                          </Tooltip>
                        )}
                        {getHighestAgreement(agreeableness) === "disagree" && (
                          <Tooltip
                            componentsProps={{
                              tooltip: {
                                sx: {
                                  backgroundColor: colors.darkGray,
                                },
                              },
                            }}
                            title={
                              <Box sx={{ p: 1 }}>
                                <Typography
                                  fontSize={"14px"}
                                  fontWeight={"bold"}
                                >
                                  This paper tends to answer your question with{" "}
                                  <Chip
                                    icon={<CancelIcon />}
                                    label={"No"}
                                    size="small"
                                    sx={{
                                      bgcolor: colors.red,
                                      color: colors.white,
                                      "& .MuiChip-icon": {
                                        color: colors.white,
                                      },
                                    }}
                                  />
                                  .
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 1,
                                    alignItems: "center",
                                    pt: "8px",
                                  }}
                                >
                                  <Chip
                                    icon={<CheckCircleIcon />}
                                    label={`${agreeableness?.agree || 0}%`}
                                    size="small"
                                    sx={{
                                      bgcolor: colors.green,
                                      color: colors.white,
                                      "& .MuiChip-icon": {
                                        color: colors.white,
                                      },
                                    }}
                                  />
                                  {/* <Chip
                                    icon={<HelpIcon />}
                                    label={`${agreeableness?.neutral || 0}%`}
                                    size="small"
                                    sx={{
                                      bgcolor: "#D8D8D8",
                                      color: "orange",
                                      "& .MuiChip-icon": { color: "orange" },
                                    }}
                                  /> */}
                                  <Chip
                                    icon={<CancelIcon />}
                                    label={`${agreeableness?.disagree || 0}%`}
                                    size="small"
                                    sx={{
                                      bgcolor: colors.red,
                                      color: colors.white,
                                      "& .MuiChip-icon": {
                                        color: colors.white,
                                      },
                                    }}
                                  />
                                </Box>
                              </Box>
                            }
                            arrow
                          >
                            <Chip
                              icon={<CancelIcon />}
                              label="No"
                              size="small"
                              sx={{
                                bgcolor: colors.red,
                                color: colors.white,
                                minWidth: "80px",
                                p: "0 4px",
                                "& .MuiChip-label": {
                                  p: "0 8px",
                                  overflow: "visible",
                                  whiteSpace: "nowrap",
                                },
                                "& .MuiChip-icon": {
                                  color: colors.white,
                                },
                              }}
                            />
                          </Tooltip>
                        )}
                        {getHighestAgreement(agreeableness) === "neutral" && (
                          <Tooltip
                            componentsProps={{
                              tooltip: {
                                sx: {
                                  backgroundColor: colors.darkGray,
                                },
                              },
                            }}
                            title={
                              <Box sx={{ p: 1 }}>
                                <Typography
                                  fontSize={"14px"}
                                  fontWeight={"bold"}
                                >
                                  This paper tends be{" "}
                                  <Chip
                                    icon={<HelpIcon />}
                                    label={"Neutral"}
                                    size="small"
                                    sx={{
                                      bgcolor: "orange",
                                      color: colors.white,
                                      "& .MuiChip-icon": {
                                        color: colors.white,
                                      },
                                    }}
                                  />{" "}
                                  regarding your question.
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 1,
                                    alignItems: "center",
                                    pt: "8px",
                                  }}
                                >
                                  <Chip
                                    icon={<CheckCircleIcon />}
                                    label={`${agreeableness?.agree || 0}%`}
                                    size="small"
                                    sx={{
                                      bgcolor: colors.green,
                                      color: colors.white,
                                      "& .MuiChip-icon": {
                                        color: colors.white,
                                      },
                                    }}
                                  />
                                  {/* <Chip
                                    icon={<HelpIcon />}
                                    label={`${agreeableness?.neutral || 0}%`}
                                    size="small"
                                    sx={{
                                      bgcolor: "#D8D8D8",
                                      color: "orange",
                                      "& .MuiChip-icon": { color: "orange" },
                                    }}
                                  /> */}
                                  <Chip
                                    icon={<CancelIcon />}
                                    label={`${agreeableness?.disagree || 0}%`}
                                    size="small"
                                    sx={{
                                      bgcolor: colors.red,
                                      color: colors.white,
                                      "& .MuiChip-icon": {
                                        color: colors.white,
                                      },
                                    }}
                                  />
                                </Box>
                              </Box>
                            }
                            arrow
                          >
                            <Chip
                              icon={<HelpIcon />}
                              label="Neutral"
                              size="small"
                              sx={{
                                bgcolor: "orange",
                                color: colors.white,
                                minWidth: "80px",
                                p: "0 4px",
                                "& .MuiChip-label": {
                                  p: "0 8px",
                                  overflow: "visible",
                                  whiteSpace: "nowrap",
                                },
                                "& .MuiChip-icon": {
                                  color: colors.white,
                                },
                              }}
                            />
                          </Tooltip>
                        )}
                      </>
                    )}
                </span>
              </>
            )}
            <span>
              <Tooltip
                title={
                  !isAuthenticated ? "Please login to bookmark documents" : ""
                }
                placement="top"
              >
                <span>
                  {" "}
                  {/* Wrapper span needed because disabled elements can't be tooltip triggers */}
                  <IconButton
                    disabled={!isAuthenticated || isBookmarkLoading}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookmarkToggle();
                    }}
                    sx={{
                      color: isBookmarked
                        ? colors.mainColorHover
                        : colors.darkGray,
                      width: "32px",
                      height: "32px",
                      "&:hover": {
                        backgroundColor: isAuthenticated
                          ? "rgba(255, 255, 255, 0.1)"
                          : "transparent",
                      },
                      cursor: isAuthenticated ? "pointer" : "not-allowed",
                    }}
                  >
                    {isBookmarkLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : isBookmarked ? (
                      <BookmarkAddedIcon />
                    ) : (
                      <BookmarkAddIcon
                        sx={{ "&:hover": { color: colors.lightGray } }}
                      ></BookmarkAddIcon>
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </span>
            <span>
              <IconButton
                onClick={() => setExpanded(!expanded)}
                sx={{
                  color: "black",
                  "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
                  width: "32px",
                  height: "32px",
                }}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </span>
          </Typography>

          <Collapse in={expanded} timeout="auto" unmountOnExit>
            {relevantSection?.mostRelevantSentence ? (
              <Typography sx={{ m: "16px" }}>
                <span>{context.before} </span>
                <Tooltip
                  componentsProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: colors.darkGray,
                      },
                    },
                  }}
                  title={
                    <Typography sx={{ fontSize: "14px", fontWeight: "bold" }}>
                      Semantically most relevant sentence from the abstract
                    </Typography>
                  }
                  arrow
                >
                  <span
                    style={{
                      fontWeight: "bold",
                      backgroundColor: colors.mainColorHover,
                      color: "white",
                    }}
                  >
                    {context.sentence}
                  </span>
                </Tooltip>
                <span> {context.after}</span>
                {context.after ? ".." : ""}
              </Typography>
            ) : (
              <Typography sx={{ m: "16px" }}>
                <span style={{ color: "black" }}>{abstract}</span>
              </Typography>
            )}

            <Box
              sx={{
                display: "flex",
                gap: "8px",
                mt: "16px",
                justifyContent: "left",
              }}
            >
              <Chip
                label={`Published ${publicationDate}`}
                sx={{
                  backgroundColor: colors.darkGray,
                  color: "white",
                  mt: "15px",
                  mr: "10px",
                }}
              />
              <Chip
                label={`Cited ${citations?.total} times`}
                sx={{
                  backgroundColor: colors.darkGray,
                  color: "white",
                  mt: "15px",
                  mr: "10px",
                }}
              />
              <Chip
                label="View on PubMed"
                icon={<LaunchIcon></LaunchIcon>}
                component="a"
                href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}`}
                target="_blank"
                rel="noopener noreferrer"
                clickable
                sx={{
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: colors.lightGray,
                  },
                  backgroundColor: colors.darkGray,
                  color: "white",
                  mt: "15px",
                  mr: "10px",
                  "& .MuiChip-icon": {
                    color: colors.white,
                  },
                }}
              />
              <Chip
                label="Read more"
                onClick={() =>
                  navigate(
                    `/documents/${pmid}?fromQuery=${encodeURIComponent(query)}`
                  )
                }
                clickable
                sx={{
                  cursor: "pointer",
                  ml: "auto",
                  "&:hover": {
                    backgroundColor: colors.lightGray,
                  },
                  backgroundColor: colors.darkGray,
                  color: colors.white,
                  mt: "15px",
                  mr: "10px",
                }}
              />
            </Box>
          </Collapse>
        </>
      )}
    </Box>
  );
};
