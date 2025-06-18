import { useState, useEffect } from "react";
import {
  Box,
  CircularProgress,
  Button,
  IconButton,
  ButtonGroup,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemText,
  TextField,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Collapse,
  Chip,
} from "@mui/material";
import GetAppIcon from "@mui/icons-material/GetApp";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import ViewSingleIcon from "@mui/icons-material/Filter1";
import ViewDoubleIcon from "@mui/icons-material/Filter2";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CommentIcon from "@mui/icons-material/Comment";
import { Document, Page, pdfjs } from "react-pdf";
import { Comment } from "../../../data/models/Comment";
import CommentService from "../../../data/services/CommentService";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  pdfBlob: Blob;
  document_id: string;
  isBookmarked: boolean;
}

function PdfViewer({ pdfBlob, document_id, isBookmarked }: PdfViewerProps) {
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [doublePageView, setDoublePageView] = useState(false);
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedComment, setExpandedComment] = useState<number | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>("");
  const [currentCommentPage, setCurrentCommentPage] = useState<number>(1);
  const [addingComment, setAddingComment] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{ id: number; page: number } | null>(null);
  const commentService = new CommentService();

  useEffect(() => {
    if (isBookmarked) {
      fetchComments();
    } else {
      setComments({});
    }
  }, [document_id, isBookmarked]);

  useEffect(() => {
    if (!isBookmarked) {
      setMenuOpen(false);
    }
  }, [isBookmarked]);

  useEffect(() => {
    window.addEventListener('error', e => {
        if (e.message === 'ResizeObserver loop limit exceeded') {
            const resizeObserverErrDiv = document.getElementById(
                'webpack-dev-server-client-overlay-div'
            );
            const resizeObserverErr = document.getElementById(
                'webpack-dev-server-client-overlay'
            );
            if (resizeObserverErr) {
                resizeObserverErr.setAttribute('style', 'display: none');
            }
            if (resizeObserverErrDiv) {
                resizeObserverErrDiv.setAttribute('style', 'display: none');
            }
        }
    });
  }, []);

  const fetchComments = () => {
    if (document_id === '') {
      return;
    }
    commentService.listComments(document_id, (response: any) => {
      const fetchedComments = response.comments || [];
      console.log("Fetched comments:", fetchedComments);
      if (Array.isArray(fetchedComments)) {
        const organizedComments: Record<number, Comment[]> = {};
        fetchedComments.forEach((comment) => {
          const page = comment.line_number;
          if (!organizedComments[page]) {
            organizedComments[page] = [];
          }
          organizedComments[page].push(comment);
        });
        setComments(organizedComments);
      } else {
        console.error('Fetched comments are not an array:', fetchedComments);
      }
    });
  };

  const addComment = () => {
    if (!newCommentText.trim()) return;
    setAddingComment(true);
    const pageToAssign = doublePageView ? Math.min(pageNumber, pageNumber + 1) : pageNumber;

    const response = commentService.createComment(
      document_id,
      newCommentText,
      pageToAssign,
      (newComment: Comment) => {
        setComments((prev) => {
          const updated = { ...prev };
          const page = newComment.line_number;
          if (!updated[page]) {
            updated[page] = [];
          }
          updated[page].push(newComment);
          return updated;
        });
        console.log('Updated Comments:', comments);
        setNewCommentText("");
        setAddingComment(false);

        commentService.listComments(document_id, (response: any) => {
          const fetchedComments = response.comments || [];
          const organizedComments: Record<number, Comment[]> = {};
          fetchedComments.forEach((comment: Comment) => {
            const page = comment.line_number;
            if (!organizedComments[page]) {
              organizedComments[page] = [];
            }
            organizedComments[page].push(comment);
          });
          setComments(organizedComments);
        });
      }
    );
  };

  const deleteComment = (comment_id: number, page_number: number) => {
    commentService.deleteComment(comment_id, () => {
      setComments((prev) => {
        const updated = { ...prev };
        updated[page_number] = updated[page_number].filter(
          (comment) => comment.comment_id !== comment_id
        );
        return updated;
      });
    });
  };

  const handleDeleteClick = (comment_id: number, page_number: number) => {
    setCommentToDelete({ id: comment_id, page: page_number });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteComment = () => {
    if (commentToDelete) {
      deleteComment(commentToDelete.id, commentToDelete.page);
      setCommentToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const cancelDeleteComment = () => {
    setCommentToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleMenuToggle = () => {
    setMenuOpen((prev) => !prev);
  };

  const handleAddCommentClick = (page: number) => {
    setCurrentCommentPage(page);
    setMenuOpen(true);
  };

  const handleCommentClick = (commentId: number) => {
    setExpandedComment(expandedComment === commentId ? null : commentId);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const zoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.1, 2));
  };

  const zoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.1, 0.5));
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

  const changePage = (offset: number) => {
    setPageNumber((prevPageNumber) => {
      const increment = doublePageView ? 2 : 1;
      return Math.min(
        Math.max(prevPageNumber + offset * increment, 1),
        numPages || 1
      );
    });
  };

  const togglePageView = () => {
    setDoublePageView(!doublePageView);
  };

  const handleOutlineItemClick = ({
    pageNumber: itemPageNumber,
  }: {
    pageNumber: number;
  }) => {
    setPageNumber(itemPageNumber);
  };

  return (
    <Box
      height="100%"
      sx={{
        backgroundColor: "#212121",
        borderRadius: "16px",
        overflow: "hidden",
        padding: "16px",
        position: "relative",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* PDF Toolbar */}
      <Box
        className="pdf-toolbar"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        display="flex"
        height="50px"
        sx={{
          backgroundColor: "white",
          borderRadius: "8px",
          marginBottom: "16px",
          padding: "0 16px",
        }}
      >
        <Box display="flex" alignItems="center" sx={{ marginRight: "auto" }}>
          <IconButton
            onClick={togglePageView}
            sx={{
              color: "black",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            {doublePageView ? <ViewSingleIcon /> : <ViewDoubleIcon />}
          </IconButton>
          <IconButton
            onClick={handleDownloadClick}
            className="icon-button-download"
            sx={{
              borderRadius: "5px",
              height: "30px",
              width: "30px",
              color: "black",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              },
            }}
          >
            <GetAppIcon />
          </IconButton>
          <ButtonGroup
            className="button-group-zoom"
            sx={{
              height: "30px",
              backgroundColor: "#D8D8D8",
              borderRadius: "5px",
            }}
          >
            <Button onClick={zoomOut} sx={{ color: "black" }}>
              <ZoomOutIcon />
            </Button>
            <Button onClick={zoomIn} sx={{ color: "black" }}>
              <ZoomInIcon />
            </Button>
          </ButtonGroup>
        </Box>
        <Box display="flex" alignItems="center" sx={{ marginLeft: "auto" }}>
          <Button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            sx={{
              color: "black",
              "&:hover": {
                backgroundColor: "#1976d2",
              },
              "&:disabled": {
                color: "#9e9e9e",
              },
            }}
          >
            Previous
          </Button>
          <Typography sx={{ color: "black", margin: "0 8px" }}>
            Page {doublePageView ? Math.ceil(pageNumber / 2) : pageNumber} of {doublePageView ? Math.ceil((numPages || 0) / 2) : numPages}
          </Typography>
          <Button
            onClick={() => changePage(1)}
            disabled={pageNumber >= (numPages || 0)}
            sx={{
              color: "black",
              "&:hover": {
                backgroundColor: "#1976d2",
              },
              "&:disabled": {
                color: "#9e9e9e",
              },
            }}
          >
            Next
          </Button>
          {isBookmarked && (
            <IconButton
              onClick={handleMenuToggle}
              sx={{
                color: "black",
                ml: 2,
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                },
              }}
            >
              <CommentIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      <Box display="flex" flexGrow={1}>
        {/* PDF Document */}
        <Box
          className="pdf-box"
          sx={{
            overflow: "auto",
            height: "100%",
            flexGrow: 1,
            display: "flex",
            justifyContent: "center",
            backgroundColor: "#D8D8D8",
            borderRadius: "8px",
          }}
        >
          <Document
            file={pdfBlob}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<CircularProgress />}
          >
            <Box display="flex">
              <Page
                pageNumber={pageNumber}
                scale={zoom}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              {doublePageView && pageNumber < (numPages || 0) && (
                <Page
                  pageNumber={pageNumber + 1}
                  scale={zoom}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              )}
            </Box>
          </Document>
        </Box>

        {/* Side Menu Drawer */}
        <Box
          sx={{
            width: menuOpen ? 250 : 0,
            transition: 'width 0.3s',
            overflow: 'hidden',
            backgroundColor: '#D8D8D8',
            color: 'white',
            boxShadow: '0px 8px 16px 0px rgba(0,0,0,0.2)',
            zIndex: 2,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ padding: '16px' }}>
            <TextField
              label="Your Comment"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              sx={{ mb: 2, backgroundColor: 'white', borderRadius: '8px' }}
            />
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={addComment}
              disabled={addingComment}
              fullWidth
            >
              {addingComment ? "Adding..." : "Add Comment"}
            </Button>
          </Box>
          <Box sx={{ padding: '16px', overflowY: 'auto', flexGrow: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ color: "black", paddingBottom: "16px" }}>
              Comments
            </Typography>
            {comments[pageNumber] && comments[pageNumber].length > 0 ? (
              comments[pageNumber].map((comment) => (
                <Chip
                  key={comment.comment_id}
                  label={comment.comment_text || 'No text available'}
                  onDelete={() => handleDeleteClick(comment.comment_id, comment.line_number)}
                  deleteIcon={<DeleteIcon sx={{ color: "red", alignSelf: "right" }} />}
                  sx={{
                    backgroundColor: 'white',
                    color: 'black',
                    cursor: 'default',
                    mb: 1,
                    width: '100%',
                    '& .MuiChip-label': {
                      whiteSpace: 'normal',
                      padding: '16px 12px',
                      lineHeight: 1.4,
                      display: 'block',
                    }
                  }}
                />
              ))
            ) : (
              <Typography variant="body2" sx={{ color: "black" }}>No comments available.</Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDeleteComment}
        aria-labelledby="delete-comment-dialog-title"
        aria-describedby="delete-comment-dialog-description"
      >
        <DialogTitle id="delete-comment-dialog-title" sx={{ color: "#000" }}>Delete Comment</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-comment-dialog-description" sx={{ color: "#000" }}>
            Are you sure you want to delete this comment? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteComment} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteComment} color="primary" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PdfViewer;

