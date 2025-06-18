import React, { useState, useEffect } from "react";
import { colors } from "../../../styles/colors/Colors";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Avatar,
  Divider,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../../../context/AuthContext";
import WordCloud from "../../components/WordCloud";
import { PaperTile } from "../../components/paperTile/PaperTile";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ProfilePage = () => {
  const { user, token, setUser } = useAuth();
  const [numberQuestions, setNumberQuestions] = useState<number | null>(null);
  const [chartData, setChartData] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [queries, setQueries] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<{ text: string; value: number }[]>(
    []
  );
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    gender: user?.gender || "",
    date_of_birth: user?.date_of_birth || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Ranks for display text only
  const ranks = [
    { name: "a Beginner", min: 0, max: 10 },
    { name: "an Intermediate", min: 11, max: 50 },
    { name: "an Expert", min: 51, max: 100 },
    { name: "Master", min: 101, max: Infinity },
  ];

  const getCurrentRank = (questions: number) => {
    return (
      ranks.find((rank) => questions >= rank.min && questions <= rank.max) ||
      ranks[0]
    );
  };

  const getNextRank = (questions: number) => {
    const currentIndex = ranks.findIndex(
      (rank) => rank.min <= questions && rank.max >= questions
    );
    return ranks[currentIndex + 1];
  };

  const currentRank = getCurrentRank(user?.number_questions || 0);
  const nextRank = getNextRank(user?.number_questions || 0);

  const progress = nextRank
    ? Math.max(
        0,
        (((user?.number_questions || 0) - currentRank.min) /
          (nextRank.min - currentRank.min)) *
          100
      )
    : 100;

  // Fixed blue color for the progress bar and chart elements
  const fixedBlue = "#1E58EB";

  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    const fetchBookmarksAndDocuments = async () => {
      try {
        const bookmarksResponse = await fetch(
          "http://localhost:8000/api/bookmarks/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!bookmarksResponse.ok) {
          throw new Error("Failed to fetch bookmarks");
        }
        const bookmarksData = await bookmarksResponse.json();
        const bookmarkIds = bookmarksData.bookmarks.map(
          (bookmark: any) => bookmark.document_id
        );

        const documentPromises = bookmarkIds.map((documentId: number) =>
          fetch(`http://localhost:8000/documents/${documentId}/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }).then((res) => {
            if (!res.ok) {
              throw new Error(`Failed to fetch document with ID ${documentId}`);
            }
            return res.json();
          })
        );

        const documentsData = await Promise.all(documentPromises);
        const fullDocuments = documentsData.map(
          (docData: any) => docData.document
        );
        setDocuments(fullDocuments);
        console.log(fullDocuments);
      } catch (error) {
        console.error("Error fetching bookmarked documents:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchBookmarksAndDocuments();
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        gender: user.gender || "",
        date_of_birth: user.date_of_birth || "",
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/user/daily-questions/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok)
          throw new Error("Failed to fetch daily question data");
        const data = await response.json();
        setChartData(data);
      } catch (error) {
        console.error("Error fetching chart data:", error);
      }
    };
    if (token) fetchChartData();
  }, [token]);

  useEffect(() => {
    const fetchSearchHistory = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/search-history/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to fetch search history");
        const data = await response.json();
        setSearchHistory(data);
        const extractedQueries = data.map((entry: any) => entry.query_text);
        setQueries(extractedQueries);
      } catch (error) {
        console.error("Error fetching search history:", error);
      }
    };
    if (token) fetchSearchHistory();
  }, [token]);

  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/openai/query-keywords",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ queries }),
          }
        );
        if (!response.ok) throw new Error("Failed to fetch keywords");
        const data = await response.json();
        const keywordData = data.keywords
          .split("\n")
          .map((keyword: string) => ({
            text: keyword.trim(),
            value: Math.floor(Math.random() * 50) + 10,
          }));
        setKeywords(keywordData);
      } catch (error) {
        console.error("Error fetching keywords:", error);
      }
    };
    if (queries.length > 0) fetchKeywords();
  }, [queries, token]);

  useEffect(() => {
    const extractedQueries = searchHistory.map(
      (entry: any) => entry.query_text
    );
    setQueries(extractedQueries);
  }, [searchHistory]);

  useEffect(() => {
    const fetchNumberQuestions = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/user/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch user details");
        }
        const data = await response.json();
        setNumberQuestions(data.number_questions || 0);
      } catch (error) {
        console.error("Error fetching number of questions:", error);
      }
    };
    if (token) fetchNumberQuestions();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim())
      newErrors.first_name = "First name is required";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last name is required";
    if (!formData.gender.trim()) newErrors.gender = "Gender is required";
    if (!formData.date_of_birth.trim())
      newErrors.date_of_birth = "Date of birth is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/user/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error details:", errorData);
        throw new Error("Failed to update profile");
      }
      const updatedUser = await response.json();
      setUser(updatedUser);
      setOpen(false);
    } catch (error) {
      console.error("handleSave Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box
        sx={{ backgroundColor: "white", minHeight: "100vh", padding: "32px 0" }}
      >
        <Container maxWidth="sm">
          <Typography variant="h6" color="error">
            Please log in to view your profile.
          </Typography>
        </Container>
      </Box>
    );
  }

  const totalQuestions = user?.number_questions || 0;
  const currentRankName = currentRank?.name || "";
  const nextRankThreshold = nextRank ? nextRank.min : "∞";
  const needed = nextRank ? nextRank.min - totalQuestions : 0;

  return (
    <Box
      sx={{ backgroundColor: "white", minHeight: "100vh", padding: "32px 0" }}
    >
      <br />
      <br />
      <Container maxWidth="md">
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                width: "100%",
              }}
            >
              <Button
                onClick={() => setOpen(true)}
                sx={{
                  backgroundColor: "#f5f5f5",
                  color: "black",
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#f5f5f5" },
                }}
              >
                Edit Profile
              </Button>
            </Box>

            <Avatar
              sx={{
                width: 80,
                height: 80,
                backgroundColor: colors.mainColor,
                fontSize: "2rem",
                m: 1,
              }}
            >
              {user?.first_name?.[0]}
              {user?.last_name?.[0]}
            </Avatar>
            <Typography
              variant="h4"
              sx={{ textAlign: "center", color: "black", fontSize: "25px" }}
            >
              {user?.first_name} {user?.last_name}
            </Typography>
          </Box>
          <Divider sx={{ backgroundColor: "#f5f5f5", my: 2 }} />
          <Grid container justifyContent="center" spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography
                variant="subtitle2"
                sx={{ color: "black", textAlign: "center" }}
              >
                Email
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontStyle: "italic",
                  textAlign: "center",
                  wordWrap: "break-word",
                  color: "black",
                }}
              >
                {user?.email}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography
                variant="subtitle2"
                sx={{ color: "black", textAlign: "center" }}
              >
                Gender
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontStyle: "italic",
                  textAlign: "center",
                  wordWrap: "break-word",
                  color: "black",
                }}
              >
                {user?.gender}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography
                variant="subtitle2"
                sx={{ color: "black", textAlign: "center" }}
              >
                Date of Birth
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontStyle: "italic",
                  textAlign: "center",
                  wordWrap: "break-word",
                  color: "black",
                }}
              >
                {user?.date_of_birth}
              </Typography>
            </Grid>
          </Grid>
          <Divider sx={{ backgroundColor: "#f5f5f5", my: 2 }} />

          {/* Display rank and progress */}
          <Box sx={{ textAlign: "center", mb: "16px" }}>
            <Typography variant="h6" sx={{ mb: "16px", color: "black" }}>
              Let´s keep track!
            </Typography>
            <Typography variant="h6" sx={{ mb: "16px", color: "black" }}>
              You have asked {totalQuestions} questions and are currently{" "}
              {currentRankName}.
            </Typography>
            <Typography variant="body2" sx={{ mt: 2, color: "black" }}>
              To reach the next rank with {nextRankThreshold} questions, you
              need to ask {needed} more questions.
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Box sx={{ width: "100%", mb: 1 }}>
              <br />
              <Box
                sx={{
                  backgroundColor: "#424242",
                  borderRadius: 2,
                  height: "8px",
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    backgroundColor: fixedBlue,
                    height: "100%",
                    width: `${Math.min(progress, 100)}%`,
                  }}
                />
              </Box>
            </Box>
          </Box>

          <Divider sx={{ backgroundColor: "#f5f5f5", my: 2 }} />

          <Typography
            variant="h6"
            sx={{ color: "black", textAlign: "center", mb: 2 }}
          >
            Questions Asked in the Last 30 Days
          </Typography>
          <Box
            sx={{
              backgroundColor: "white",
              p: 2,
              borderRadius: 2,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#e0e0e0"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(dateStr) => {
                    const date = new Date(dateStr);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  tick={{ fill: fixedBlue, fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: fixedBlue, fontSize: 10 }}
                  tickFormatter={(value) =>
                    Number.isInteger(value) ? value : ""
                  }
                  allowDecimals={false}
                />
                <Tooltip
                  separator=": "
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "none",
                    borderRadius: 2,
                    padding: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                  labelStyle={{
                    color: fixedBlue,
                    fontWeight: "bold",
                    marginBottom: 8,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: fixedBlue, fontSize: 12 }}
                  cursor={false}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={fixedBlue}
                  strokeWidth={3}
                  dot={{ fill: fixedBlue, r: 4 }}
                  activeDot={{ stroke: fixedBlue, strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>

          <Divider sx={{ backgroundColor: "#f5f5f5", my: 2 }} />

          <Typography
            variant="h6"
            sx={{ color: "black", textAlign: "center", mb: 2 }}
          >
            Your Most Searched Topics
          </Typography>
          <Box
            sx={{
              marginTop: "10px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: 400,
              backgroundColor: "white",
              borderRadius: 2,
              mt: 3,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
              overflow: "hidden",
            }}
          >
            {keywords.length > 0 ? (
              <WordCloud words={keywords} />
            ) : (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <CircularProgress color="primary" />
              </Box>
            )}
          </Box>
          <Divider sx={{ backgroundColor: "#f5f5f5", my: 2 }} />

          <Typography
            variant="h6"
            sx={{ color: "black", textAlign: "center", mb: 2 }}
          >
            Your Bookmarked Documents    
          </Typography>
          <Box sx={{ mt: 3 }}>
            {documents.length === 0 ? (
              <Typography
                variant="body1"
                align="center"
                sx={{ color: "black" }}
              >
                No bookmarks yet — start exploring research topics and save your
                favorite papers!
              </Typography>
            ) : (
              <Box>
                {documents.map((doc, index) => (
                  <Box
                    key={`doc-${doc.pmid || index}`}
                    id={`document-${doc.document_id}`}
                    sx={{ mb: "16px" }}
                  >
                    <PaperTile
                      query=""
                      aiSummary=""
                      pmid={doc.pmid || ""}
                      title={doc.title || ""}
                      abstract={doc.abstract || ""}
                      publicationDate={doc.year ? doc.year.toString() : ""}
                      showAISummary={false}
                      showAgreeButton={false}
                      showRelevantSection={true}
                      relevantSection={doc.relevantSection || ""}
                      citations={{ total: doc.citation_count || 0 }}
                      orderNumber={index + 1}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </CardContent>
        <Box>
          <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
            <DialogTitle sx={{ color: "black" }}>Edit Profile</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                margin="dense"
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                error={!!errors.first_name}
                helperText={errors.first_name}
              />
              <TextField
                fullWidth
                margin="dense"
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                error={!!errors.last_name}
                helperText={errors.last_name}
              />
              <TextField
                fullWidth
                margin="dense"
                label="Email"
                name="email"
                value={formData.email}
                disabled
                inputProps={{ style: { color: "gray" } }}
              />
              <TextField
                fullWidth
                margin="dense"
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                error={!!errors.gender}
                helperText={errors.gender}
              />
              <TextField
                fullWidth
                margin="dense"
                label="Date of Birth"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                error={!!errors.date_of_birth}
                helperText={errors.date_of_birth}
              />
            </DialogContent>
            <DialogActions
              sx={{
                display: "flex",
                justifyContent: "space-between",
                p: 2,
              }}
            >
              <Button
                onClick={() => setOpen(false)}
                sx={{
                  backgroundColor: "#f5f5f5",
                  color: "black",
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#f5f5f5" },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
                sx={{
                  backgroundColor: "#f5f5f5",
                  color: "black",
                  borderRadius: 2,
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#f5f5f5" },
                }}
              >
                {loading ? (
                  <>
                    Saving
                    <CircularProgress size={20} sx={{ ml: 1 }} />
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </Box>
  );
};

export default ProfilePage;
