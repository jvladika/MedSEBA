import React, { useEffect, useState } from "react";
import { colors } from "../../../styles/colors/Colors";
import { useParams, useNavigate } from "react-router-dom";
import { FullDocument } from "../../../data/models/FullDocument";
import FullDocumentService from "../../../data/services/FullDocumentService";
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  Button,
  Snackbar,
  Skeleton,
  Grid,
  Link,
  Breadcrumbs,
} from "@mui/material";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAdd";
import LaunchIcon from "@mui/icons-material/Launch";
import ShareIcon from "@mui/icons-material/Share";
import LocalLibraryIcon from "@mui/icons-material/LocalLibrary";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { CitationDialog } from "../../components/citationDialog/CitationDialog";
import { useSnackbar } from "notistack";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
import BookmarkService from "../../../data/services/BookmarkService";
import { PaperTile } from "../../components/paperTile/PaperTile";
import { Document } from "../../../data/models/Document";
import PdfViewer from "../../components/pdfViewer/PdfViewer";
import PubmedPDFService from "../../../data/services/PubmedPDFService";
import { useLocation } from "react-router-dom";
import CommentService from "../../../data/services/CommentService";
import { random } from "lodash";
import { useAuth } from "../../../context/AuthContext";

const pastelColors = ["#BAFFC9", "#BAE1FF", "#D3BAFF"];

const fetchKeywords = async (
  text: string,
  topN: number = 3
): Promise<string[]> => {
  const response = await fetch(
    `http://localhost:8000/openai/medical-keywords`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, top_n: topN }),
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  const keywordsString = data.keywords || "";
  const keywordsArray = keywordsString
    .split(",")
    .map((keyword: string) => keyword.trim().replace(/["\[\]]/g, ""));
  return keywordsArray;
};

//Types
interface TopDocumentResponse {
  documents: Document[];
}

const DocumentPage: React.FC = () => {
  const [document, setDocument] = useState<FullDocument | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { pmid } = useParams<{ pmid: string }>();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [citationDialogOpen, setCitationDialogOpen] = useState(false);
  const [citations, setCitations] = useState<{
    bibtex: string;
    mla: string;
    apa: string;
  } | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [recommendedPapers, setRecommendedPapers] = useState<Document[]>([]);
  const [isLoadingRecommendedPapers, setIsLoadingRecommendedPapers] =
    useState(true);
  const [recommendedPapersCitations, setRecommendedPapersCitations] = useState<
    Map<string, number>
  >(new Map());
  const location = useLocation();
  const fromQuery = new URLSearchParams(location.search).get("fromQuery");

  useEffect(() => {
    const documentService = new FullDocumentService();

    if (pmid) {
      documentService.getDocumentByPmid(pmid, (response) => {
        const existingDoc = (response as any).document;
        if (existingDoc) {
          setIsBookmarked(true);
          console.log("was Bookmarked", isBookmarked);
        }
      });
    }
  }, [pmid, isBookmarked]);

  useEffect(() => {
    //if (!isAuthenticated) {
    //    navigate('/login');
    //    return;
    //}

    const fetchDocument = async () => {
      if (!pmid) return;
      setLoading(true);
      const documentService = new FullDocumentService();
      const pdfService = new PubmedPDFService();

      try {
        let existingDocument: FullDocument | null = null;
        await documentService.getDocumentByPmid(pmid, (response: any) => {
          if (response.status === "success") {
            const existingDocument = (response as any).document;
            if (existingDocument?.document_id) {
              setDocument(existingDocument);
              //setIsBookmarked(true);
              //console.log("was Bookmarked", isBookmarked);
              if (
                existingDocument.fields_of_study &&
                existingDocument.fields_of_study.length > 0
              ) {
                setKeywords(existingDocument.fields_of_study);
              }
            }
          }
        });

        if (existingDocument) {
          const scholarData = await new Promise<Partial<FullDocument>>(
            (resolve) => {
              documentService.getDocumentMetadata(pmid, (response) => {
                if (!response) {
                  resolve({});
                  return;
                }

                const data = {
                  reference_count: response.reference_count || 0,
                  citation_count: response.citation_count || 0,
                  influential_citation_count:
                    response.influential_citation_count || 0,
                };

                resolve(data);
              });
            }
          );

          documentService.updateDocument(
            (existingDocument as FullDocument).document_id || "",
            scholarData,
            (updatedDoc) => {
              setDocument((prev) => ({
                ...prev!,
                ...updatedDoc,
                title: prev?.title || updatedDoc.title,
                abstract: prev?.abstract || updatedDoc.abstract,
                authors: prev?.authors || updatedDoc.authors,
                journal: prev?.journal || updatedDoc.journal,
                publication_venue:
                  prev?.publication_venue || updatedDoc.publication_venue,
                year: prev?.year || updatedDoc.year,
                source_url: prev?.source_url || updatedDoc.source_url,
              }));
            }
          );
        } else {
          const pubmedData = await new Promise<Partial<FullDocument>>(
            (resolve, reject) => {
              documentService.getPubmedDocumentMetadata(
                pmid,
                (response, error) => {
                  if (error || !response) {
                    reject(new Error("Error fetching PubMed data"));
                    return;
                  }

                  const data = {
                    pmid: response.pmid || "",
                    title: response.title || "Untitled",
                    abstract: response.abstract || "No abstract available.",
                    year: response.year || 0,
                    source_url: response.pmid
                      ? `https://pubmed.ncbi.nlm.nih.gov/${response.pmid}`
                      : "",
                  };

                  resolve(data);
                }
              );
            }
          );

          const scholarData = await new Promise<Partial<FullDocument>>(
            (resolve) => {
              documentService.getDocumentMetadata(pmid, (response) => {
                if (!response) {
                  resolve({});
                  return;
                }

                const data = {
                  reference_count: response.reference_count || 0,
                  publication_venue: response.publication_venue || {
                    name: "Unknown",
                  },
                  citation_count: response.citation_count || 0,
                  influential_citation_count:
                    response.influential_citation_count || 0,
                  fields_of_study: [], //response.fields_of_study || [],
                  journal: response.journal || { name: "Unknown" },
                  authors: response.authors || [],
                };

                resolve(data);
              });
            }
          );

          const newDocument: Partial<FullDocument> = {
            ...pubmedData,
            ...scholarData,
            overall_similarity: 0,
            embedding_model: "",
            most_relevant_sentence: "",
            similarity_score: 0,
            entailment_model: "",
            agree: "",
            disagree: "",
            neutral: "",
          };

          delete (newDocument as any).document_id;
          setDocument(newDocument as FullDocument);
          setIsBookmarked(false);
        }

        pdfService.fetchPdf(pmid, (data, error) => {
          if (error) {
            console.error("Error fetching PDF:", error);
            setPdfBlob(null);
          } else {
            console.log("PDF fetched successfully");
            setPdfBlob(data);
          }
        });

        //setLoading(false);

        /*if (document?.title) {
          let recommended = await fetchRecommendedPapers(document.title);
          recommended = recommended.slice(0, 5);
          setRecommendedPapers(recommended);

          const citationMap = new Map<string, number>();
          recommended.forEach((doc) => {
            if (doc.pmid && doc.citations?.total) {
              citationMap.set(doc.pmid, doc.citations.total);
            }
          });

          setRecommendedPapersCitations(citationMap);
          setIsLoadingRecommendedPapers(false);
        }*/
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, []); //[pmid, enqueueSnackbar, navigate, isAuthenticated, document?.title]);

  const fetchRecommendedPapers = async (query: string): Promise<Document[]> => {
    const response = await fetch(
      `http://localhost:8000/query/info/?query=${encodeURIComponent(
        query
      )}?max_results=5`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: TopDocumentResponse = await response.json();
    return data.documents || [];
  };

  useEffect(() => {
    if (document?.title) {
      const fetchPapers = async () => {
        try {
          let recommended = await fetchRecommendedPapers(document.title || "");
          recommended = recommended.slice(0, 5);
          setRecommendedPapers(recommended);

          const citationMap = new Map<string, number>();
          recommended.forEach((doc) => {
            if (doc.pmid && doc.citations?.total) {
              citationMap.set(doc.pmid, doc.citations.total);
            }
          });

          setRecommendedPapersCitations(citationMap);
          setIsLoadingRecommendedPapers(false);
        } catch (error) {
          console.error("Error fetching recommended papers:", error);
        }
      };

      fetchPapers();
    }
  }, [document?.title, enqueueSnackbar, navigate, isAuthenticated]);

  useEffect(() => {
    console.log("fields_of_study", document?.fields_of_study);
    const fetchDocumentKeywords = async () => {
      if (
        document?.abstract &&
        (!document.fields_of_study || document.fields_of_study.length === 0)
      ) {
        try {
          const fetchedKeywords = await fetchKeywords(document.abstract);
          setKeywords(fetchedKeywords);
          console.log("fetchedKeywords", fetchedKeywords);
        } catch (error) {
          console.error("Error fetching keywords:", error);
        }
      }
    };

    fetchDocumentKeywords();
  }, [document]); //, enqueueSnackbar]);

  const handleShare = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setOpenSnackbar(true);
      })
      .catch((error) => {
        console.error("Failed to copy URL:", error);
      });
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleCiteClick = async () => {
    if (!pmid) return;

    const service = new FullDocumentService();
    await new Promise<void>((resolve) => {
      service.getCitations(pmid, (response) => {
        if (response) {
          setCitations({
            bibtex: response.bibtex,
            mla: response.mla,
            apa: response.apa,
          });
          setCitationDialogOpen(true);
        }
        resolve();
      });
    });
  };

  const handleBookmarkToggle = () => {
    if (!document) return;
    const documentService = new FullDocumentService();
    const bookmarkService = new BookmarkService();
    const commentService = new CommentService();

    if (!isBookmarked) {
      const updatedDocument = {
        ...document,
        fields_of_study: keywords,
      };

      if (!document.document_id || document.document_id === "") {
        documentService.createDocument(updatedDocument, (response) => {
          const savedDoc = (response as any).document;
          if (savedDoc?.document_id) {
            bookmarkService.createBookmark(savedDoc.document_id, () => {
              setDocument(savedDoc);
              setIsBookmarked(true);
              enqueueSnackbar("Document saved to bookmarks", {
                variant: "success",
                autoHideDuration: 2000,
                anchorOrigin: { vertical: "top", horizontal: "center" },
              });
            });
          }
        });
      } else {
        documentService.updateDocument(
          document.document_id,
          updatedDocument,
          (updatedDoc) => {
            setDocument(updatedDoc);
            bookmarkService.createBookmark(document.document_id || "", () => {
              setIsBookmarked(true);
              enqueueSnackbar("Document saved to bookmarks", {
                variant: "success",
                autoHideDuration: 2000,
                anchorOrigin: { vertical: "top", horizontal: "center" },
              });
            });
          }
        );
      }
    } else {
      if (!document.document_id) {
        console.error("No document_id found for bookmarked document");
        return;
      }
      commentService.deleteAllComments(document.document_id, () => {
        bookmarkService.deleteBookmark(document.document_id || "", () => {
          documentService.deleteDocument(document.document_id || "", () => {
            setIsBookmarked(false);
            setDocument((prev) => ({ ...prev!, document_id: undefined }));
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

  useEffect(() => {
    const resizeObserverError = (event: ErrorEvent) => {
      if (
        event.message ===
        "ResizeObserver loop completed with undelivered notifications."
      ) {
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener("error", resizeObserverError);
    return () => {
      window.removeEventListener("error", resizeObserverError);
    };
  }, []);

  const handleBack = () => {
    if (fromQuery) {
      navigate(`/results?q=${encodeURIComponent(fromQuery)}`);
    } else {
      navigate(-1);
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        minHeight: "100vh",
        width: "100%",
        padding: "24px",
        color: "#212121",
        maxWidth: "1000px",
        margin: "0 auto",
        px: { xs: 2, md: 4 },
      }}
    >
      <Box
        sx={{
          marginTop: "20px",
          display: "flex",
          alignItems: "center",
          width: "100%",
          maxWidth: "1200px",
          mb: 4,
          mt: 6,
          gap: 2,
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{
            color: "white",
            textTransform: "none",
            backgroundColor: colors.darkGray,
            "&:hover": {
              borderColor: "white",
              backgroundColor: colors.lightGray,
            },
          }}
        >
          Back
        </Button>
      </Box>

      <Box sx={{ maxWidth: "1200px", width: "100%" }}>
        <Card
          sx={{
            backgroundColor: colors.whiteGray,
            borderRadius: "20px",
            marginBottom: "24px",
            padding: "24px",
            width: "100%",
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 5,
                paddingTop: "5px",
              }}
            >
              {loading ? (
                <Skeleton
                  variant="text"
                  width="100%"
                  height={40}
                  sx={{
                    bgcolor: colors.whiteGray,
                    position: "absolute",
                    zIndex: 1,
                    top: 0,
                    left: 0,
                  }}
                />
              ) : (
                <>
                  {keywords && keywords.length > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      {keywords.map((keyword, index) => (
                        <Chip
                          key={index}
                          label={keyword}
                          variant="outlined"
                          sx={{
                            backgroundColor:
                              pastelColors[index % pastelColors.length],
                            color: "#000",
                            margin: "4px",
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </>
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 5,
              }}
            >
              {loading ? (
                <Skeleton
                  variant="text"
                  width="100%"
                  height={40}
                  sx={{
                    bgcolor: colors.whiteGray,
                    position: "absolute",
                    zIndex: 1,
                    top: 0,
                    left: 0,
                  }}
                />
              ) : (
                <>
                  <Typography
                    variant="h5"
                    sx={{
                      color: "#000",
                      fontWeight: "bold",
                      flexGrow: 1,
                      textAlign: "center",
                      wordSpacing: "2px",
                    }}
                  >
                    {document?.title}
                  </Typography>
                  <Box sx={{ ml: 2 }}>
                    <IconButton
                      onClick={handleBookmarkToggle}
                      sx={{
                        color: isBookmarked ? "#1976d2" : "#D8D8D8",
                        width: "32px",
                        height: "32px",
                        "&:hover": {
                          backgroundColor: "rgba(255, 255, 255, 0.1)",
                        },
                      }}
                    >
                      {isBookmarked ? (
                        <BookmarkAddedIcon />
                      ) : (
                        <BookmarkAddIcon />
                      )}
                    </IconButton>
                  </Box>
                </>
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 4,
                mb: 3,
                justifyContent: "center",
                alignItems: "center",
                flexWrap: "nowrap",
              }}
            >
              {["Author(s)", "Journal", "Venue"].map((label, index) => (
                <Box
                  key={label}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    minWidth: "200px",
                  }}
                >
                  {loading ? (
                    <>
                      <Skeleton
                        variant="text"
                        width={100}
                        sx={{ bgcolor: "rgba(128, 128, 128, 0.2)" }}
                      />
                      <Skeleton
                        variant="rectangular"
                        width={200}
                        height={40}
                        sx={{
                          bgcolor: "rgba(128, 128, 128, 0.2)",
                          borderRadius: "16px",
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          color: "#9e9e9e",
                          mb: 1,
                        }}
                      >
                        {label}
                      </Typography>
                      <Chip
                        label={
                          index === 0 ? (
                            document?.authors
                              ?.map((author) => author.name)
                              .join(", ") || "Unknown"
                          ) : index === 1 ? (
                            document?.journal?.name ? (
                              `${document.journal.name}${
                                document.journal.volume
                                  ? ` (Vol. ${document.journal.volume})`
                                  : ""
                              }`
                            ) : (
                              "Unknown"
                            )
                          ) : document?.publication_venue?.name ? (
                            <>
                              {document.publication_venue.name}
                              {document.publication_venue.issn &&
                                ` (ISSN: ${document.publication_venue.issn})`}
                              {document.publication_venue.type &&
                                ` - ${document.publication_venue.type}`}
                            </>
                          ) : (
                            "Unknown"
                          )
                        }
                        onClick={
                          index === 1 && document?.publication_venue?.url
                            ? () =>
                                window.open(
                                  document.publication_venue.url,
                                  "_blank"
                                )
                            : undefined
                        }
                        sx={{
                          //backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          //color: '#000',
                          //maxWidth: '100%',
                          backgroundColor: colors.darkGray,
                          color: colors.white,
                          marginRight: "10px",
                          height: "auto",
                          cursor:
                            index === 1 && document?.publication_venue?.url
                              ? "pointer"
                              : "default",
                          "& .MuiChip-label": {
                            whiteSpace: "normal",
                            padding: "8px 12px",
                            lineHeight: 1.4,
                          },
                          "&:hover": {
                            backgroundColor:
                              index === 1 && document?.publication_venue?.url
                                ? colors.lightGray
                                : colors.transparent,
                          },
                        }}
                      />
                    </>
                  )}
                </Box>
              ))}
            </Box>

            {loading ? (
              <Box sx={{ mb: 3 }}>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={150}
                  sx={{ bgcolor: "rgba(128, 128, 128, 0.2)" }}
                />
              </Box>
            ) : (
              <Typography
                variant="body1"
                sx={{
                  color: "#000",
                  mb: 3,
                  wordSpacing: "2px",
                  lineHeight: 1.6,
                  textAlign: "left",
                }}
              >
                <strong>Abstract:</strong> {document?.abstract}
              </Typography>
            )}

            {loading ? (
              <Skeleton
                variant="text"
                width="100%"
                height={40}
                sx={{ bgcolor: "rgba(128, 128, 128, 0.2)" }}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  mb: 2,
                  justifyContent: "center",
                  "& .MuiChip-root": {
                    margin: "4px",
                  },
                }}
              >
                <Chip
                  label={`Published ${document?.year}`}
                  sx={{
                    backgroundColor: colors.darkGray,
                    color: colors.white,
                  }}
                />
                <Chip
                  label={`Citations: ${document?.citation_count}`}
                  sx={{
                    backgroundColor: colors.darkGray,
                    color: colors.white,
                  }}
                />
                <Chip
                  label={`Influential Citations: ${document?.influential_citation_count}`}
                  sx={{
                    backgroundColor: colors.darkGray,
                    color: colors.white,
                  }}
                />
                <Chip
                  label={`References: ${document?.reference_count}`}
                  sx={{
                    backgroundColor: colors.darkGray,
                    color: colors.white,
                  }}
                />
              </Box>
            )}

            {loading ? (
              <Skeleton
                variant="text"
                width="100%"
                height={40}
                sx={{ bgcolor: "rgba(128, 128, 128, 0.2)" }}
              />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  gap: 4,
                  mt: 3,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  "& .MuiButton-root": {
                    minWidth: "160px",
                  },
                }}
              >
                <Button
                  variant="contained"
                  startIcon={<LaunchIcon />}
                  href={document?.source_url}
                  sx={{
                    backgroundColor: "#1976d2",
                    color: "white",
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "#1565c0",
                    },
                  }}
                >
                  View on PubMed
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ShareIcon />}
                  onClick={handleShare}
                  sx={{
                    backgroundColor: "#1976d2",
                    color: "white",
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "#1565c0",
                    },
                  }}
                >
                  Share
                </Button>
                <Button
                  variant="contained"
                  startIcon={<LocalLibraryIcon />}
                  onClick={handleCiteClick}
                  sx={{
                    backgroundColor: "#1976d2",
                    color: "white",
                    textTransform: "none",
                    "&:hover": {
                      backgroundColor: "#1565c0",
                    },
                  }}
                >
                  Cite
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          message="Link copied to clipboard!"
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
          sx={{
            "& .MuiSnackbarContent-root": {
              backgroundColor: "#1976d2",
              color: "white",
            },
          }}
        />

        <CitationDialog
          open={citationDialogOpen}
          onClose={() => setCitationDialogOpen(false)}
          citations={citations}
        />
      </Box>
      {!isAuthenticated ? (
        <Box
          sx={{
            width: "100%",
            maxWidth: "1200px",
            padding: "24px",
            backgroundColor: "white",
            borderRadius: "20px",
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, color: "#000" }}>
            You need to be logged in to view this document.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/login")}
            sx={{
              backgroundColor: "#1976d2",
              color: "white",
              textTransform: "none",
            }}
          >
            Go to Login
          </Button>
        </Box>
      ) : pdfBlob ? (
        <Box sx={{ maxWidth: "1200px", width: "100%" }}>
          <PdfViewer
            pdfBlob={pdfBlob}
            document_id={document?.document_id || ""}
            isBookmarked={isBookmarked}
          />
        </Box>
      ) : (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          sx={{
            width: "100%",
            maxWidth: "1200px",
            padding: "24px",
            backgroundColor: "white",
            borderRadius: "20px",
            textAlign: "center",
          }}
        >
          {loading ? (
            <>
              <Skeleton
                variant="text"
                width="60%"
                height={40}
                sx={{ bgcolor: "rgba(128, 128, 128, 0.2)", mb: 2 }}
              />
              <Skeleton
                variant="text"
                width="80%"
                height={20}
                sx={{ bgcolor: "rgba(128, 128, 128, 0.2)", mb: 2 }}
              />
              <Skeleton
                variant="rectangular"
                width={150}
                height={36}
                sx={{ bgcolor: "rgba(128, 128, 128, 0.2)" }}
              />
            </>
          ) : (
            <>
              <Typography variant="h6" sx={{ mb: 2, color: "black" }}>
                Sorry, full document text could not be provided.
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: "black" }}>
                To see more, please check out the source on PubMed.
              </Typography>
              <Button
                variant="contained"
                href={`https://pubmed.ncbi.nlm.nih.gov/${pmid}`}
                sx={{
                  backgroundColor: "#1976d2",
                  color: "white",
                  textTransform: "none",
                }}
              >
                View on PubMed
              </Button>
            </>
          )}
        </Box>
      )}

      <Typography
        variant="h6"
        sx={{
          mt: 2,
          mb: 1,
          color: "black",
          textAlign: "left",
          width: "100%",
          paddingLeft: 2,
        }}
      >
        Further Reads
      </Typography>
      <Box sx={{ width: "100%", maxWidth: "1200px" }}>
        {isLoadingRecommendedPapers
          ? Array.from(new Array(5)).map((_, index) => (
              <Box
                key={index}
                sx={{
                  mb: 2,
                  p: 2,
                  backgroundColor: "white",
                  borderRadius: "8px",
                }}
              >
                <Skeleton
                  variant="text"
                  width="80%"
                  sx={{ bgcolor: "rgba(128, 128, 128, 0.2)", mb: 1 }}
                />
                <Skeleton
                  variant="rectangular"
                  height={100}
                  sx={{ bgcolor: "rgba(128, 128, 128, 0.2)" }}
                />
              </Box>
            ))
          : recommendedPapers.map((paper, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <PaperTile
                  pmid={paper.pmid}
                  title={paper.title}
                  abstract={paper.abstract}
                  publicationDate={paper.publicationDate}
                  query={document?.title || ""}
                  citations={{
                    total:
                      recommendedPapersCitations.get(paper.pmid || "") ||
                      paper.citations?.total ||
                      0,
                  }}
                  orderNumber={index + 1}
                  aiSummary=""
                />
              </Box>
            ))}
      </Box>
    </Box>
  );
};

export default DocumentPage;
