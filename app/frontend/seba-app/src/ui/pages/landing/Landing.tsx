import React, { useState, useMemo } from "react";
import { colors } from "../../../styles/colors/Colors";
import { Header } from "../../components";
import { SearchBar } from "../../components/searchBar/SearchBar";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "../../../navigation/constants/Routes";
import { ExplicationCard } from "./explications/ExplicationCard";
import { strings } from "../../../resources/strings/StringsRepo";
import { SearchFilterModal } from "../../components/searchFilterModal/SearchFilterModal";
import { Box, Button, Container, Typography } from "@mui/material";

export const Landing = () => {
  const navigate = useNavigate();
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    publicationTypes: ["journal article", "review"],
    yearRange: [1900, new Date().getFullYear()] as [number, number],
    maxResults: 20,
    citationRange: [0, Infinity] as [number, number],
  });

  const handleSearch = async (query: string) => {
    navigate(`${AppRoutes.results}/?q=${encodeURIComponent(query)}`, {
      state: {
        isManualSearch: true,
        shouldSearch: true,
        searchQuery: query,
        filters: searchFilters, // Pass filters to results page
        overwriteCache: false,
      },
    });
  };

  const handleApplyFilters = (newFilters: any) => {
    setSearchFilters(newFilters);
  };

  const sampleQuestions = [
    "Does exercise reduce the risk of burnout?",
    "Can vitamin D supplementation prevent COVID-19?",
    "Is intermittent fasting effective for weight loss?",
    "Is running good for recovery after heart surgery?",
  ];

  const hasActiveFilters = useMemo(() => {
    return (
      searchFilters.publicationTypes.length !== 2 ||
      searchFilters.yearRange[0] !== 1900 ||
      searchFilters.yearRange[1] !== new Date().getFullYear() ||
      searchFilters.maxResults !== 20 ||
      searchFilters.citationRange[0] !== 0 ||
      searchFilters.citationRange[1] !== 1000
    );
  }, [searchFilters]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      {/* HERO SECTION */}
      <Box
        sx={{
          height: { xs: "80vh", md: "100vh" },
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          width: "100%",
        }}
      >
        <Container
          sx={{
            maxWidth: { xs: "90%", md: "800px" },
            px: { xs: 2, md: 0 },
            textAlign: "center",
          }}
        >
          <Header />
          <Typography
            variant="h1"
            sx={{
              color: colors.black,
              fontFamily: "var(--font-outfit)",
              fontWeight: "var(--font-outfit-weight-bold)",
              fontSize: { xs: "2rem", md: "var(--font-sizes-xx-large)" },
              p: 2,
              m: 0,
            }}
          >
            {strings.titleLanding}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: colors.black,
              fontFamily: "var(--font-outfit)",
              fontSize: { xs: "1rem", md: "var(--font-sizes-large)" },
              mt: 2,
              mb: 2,
              maxWidth: "600px",
              mx: "auto",
              lineHeight: 1.4,
            }}
          >
            Welcome to SEBAnswers! Quickly analyze academic papers with simple{" "}
            <strong>yes/no</strong> questions for clear insights.
          </Typography>
          <SearchBar
            onSearch={(query: string) => handleSearch(query)}
            onOpenFilters={() => setFilterModalOpen(true)}
            hasActiveFilters={hasActiveFilters}
          />
          <SearchFilterModal
            open={filterModalOpen}
            onClose={() => setFilterModalOpen(false)}
            filters={searchFilters}
            onApplyFilters={handleApplyFilters}
          />
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mt: 2,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {sampleQuestions.map((question, index) => (
              <button
                key={index}
                style={{
                  background: "transparent",
                  border: "1px solid black",
                  color: colors.black,
                  padding: "8px 16px",
                  borderRadius: "20px",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                }}
                onClick={() => handleSearch(question)}
                onMouseOver={(e) =>
                  ((e.target as HTMLButtonElement).style.background =
                    "rgba(255, 255, 255, 0.1)")
                }
                onMouseOut={(e) =>
                  ((e.target as HTMLButtonElement).style.background =
                    "transparent")
                }
              >
                {question}
              </button>
            ))}
          </Box>
        </Container>
      </Box>

      {/* CONTENT CONTAINER */}
      <Box sx={{ backgroundColor: "white", width: "100%" }}>
        {/* FEATURE SECTION */}
        <Box
          sx={{
            py: { xs: 4, md: 10 },
            textAlign: "center",
            px: { xs: 2, md: 0 },
          }}
        >
          <Typography
            sx={{
              fontFamily: "var(--font-outfit)",
              fontWeight: "var(--font-outfit-weight-bold)",
              fontSize: "32px",
              mb: 3,
            }}
          >
            {strings.findResponses}
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 2,
              mt: 4,
            }}
          >
            <ExplicationCard type="layer" />
            <ExplicationCard type="paperClip" />
            <ExplicationCard type="chartPie" />
          </Box>
        </Box>

        {/* PREVIEW SECTION */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            px: { xs: 2, md: "100px" },
            py: { xs: 4, md: 0 },
            gap: 4,
          }}
        >
          <Box sx={{ textAlign: "center", px: 2 }}>
            <Typography
              variant="h2"
              sx={{
                fontFamily: "var(--font-outfit)",
                fontWeight: "var(--font-outfit-weight-bold)",
                fontSize: "32px",
                mb: 2,
              }}
            >
              {strings.quisqueCondimentum}
            </Typography>
            <Typography variant="body1" sx={{ fontSize: "23px", mt: 2 }}>
              {strings.curabiturPulvinar}
            </Typography>
          </Box>
        </Box>

        {/* FOOTER */}
        <Box
          sx={{
            backgroundColor: "white",
            px: { xs: 2, md: "100px" },
            pt: { xs: 4, md: "100px" },
            pb: { xs: 2, md: "50px" },
            textAlign: "center",
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontSize: "32px",
              fontWeight: "var(--font-roboto-weight-bold)",
            }}
          >
            {strings.appName}
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontSize: "var(--font-sizes-medium)", mt: 2 }}
          >
            {strings.universityName}
          </Typography>
          <Typography
            variant="body1"
            sx={{ fontSize: "var(--font-sizes-medium)", mt: 2 }}
          >
            {strings.contactEmail}
          </Typography>
          <Box
            sx={{
              width: "100%",
              height: "1px",
              backgroundColor: "black",
              my: 3,
            }}
          />
          <Typography variant="body2" sx={{ fontSize: "13px" }}>
            {strings.copyrightsInfo}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Landing;
