// ResultPage.tsx
import { colors } from "../../../styles/colors/Colors";
import { useEffect, useState, useRef, useMemo } from "react";
import { useSnackbar } from "notistack";
import React from "react";
import ReactDOM from "react-dom";
import { SearchBar } from "../../components/searchBar/SearchBar";
import Summary from "../../components/summary/Summary";
import { Document } from "../../../data/models/Document";
import { PaperTile, SkeletonLoader } from "../../components";
import { useLocation, useNavigate } from "react-router-dom";
import { AppRoutes } from "../../../navigation/constants/Routes";
import { useSidebar } from "../../../context/SidebarContext";
import SideBar from "../../components/sideBar/SideBar";
import {
  Box,
  Chip,
  Button,
  Typography,
  Menu,
  IconButton,
  Grid,
  Tooltip,
  Skeleton,
} from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
import { useSearchHistory } from "../../../hooks/useSearchHistory";
import { useAuth } from "../../../context/AuthContext";
import { debounce, over } from "lodash";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { AgreeMeter } from "../../components/agreeMeter/AgreeMeter";
import { ChartMeter } from "../../components/chartMeter/ChartMeter";
import { SearchFilterModal } from "../../components/searchFilterModal/SearchFilterModal";

const SORT_ASCENDING = "asc";
const SORT_DESCENDING = "desc";

export const ResultPage = () => {
  const { user, token, setUser } = useAuth();
  // State for routing
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search).get("q") as string;
  const locationState = location.state as {
    shouldSearch?: boolean;
    isManualSearch?: boolean;
    searchQuery?: string;
    filters?: SearchFilters;
    overwriteCache?: boolean;
  };
  const abortControllerRef = useRef<AbortController | null>(null);

  const isIncrementing = useRef(false);

  const { enqueueSnackbar } = useSnackbar();

  // State for results
  const [documents, setDocuments] = useState<Array<Document>>([]);
  const [cachedResults, setCachedResults] = useState<Map<string, any>>(
    new Map()
  );
  const overwriteCache = locationState?.overwriteCache || false;
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [encounteredError, setEncounteredError] = useState(false);
  const [isLoadingEnrichment, setIsLoadingEnrichment] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(!query);
  const [isLoadingAgreeableness, setIsLoadingAgreeableness] = useState(true);
  const [documentOrderMap, setDocumentOrderMap] = useState<Map<string, number>>(
    new Map()
  );
  const [originalDocumentOrder, setOriginalDocumentOrder] = useState<
    Map<string, number>
  >(new Map());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const [sortByYear, setSortByYear] = useState(false);
  const [sortByCitations, setSortByCitations] = useState(false);
  const [sortBySimilarity, setSortBySimilarity] = useState(true); // Default to true
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(SORT_DESCENDING); // Default to descending

  const [sortError, setSortError] = useState("");
  //const [sortOrder, setSortOrder] = useState<"asc" | "desc">(SORT_ASCENDING);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [activeFilters, setActiveFilters] = useState<{
    yearRange?: [number, number];
    citationRange?: [number, number];
  }>({});
  const [documentSummaries, setDocumentSummaries] = useState<{
    [key: string]: string;
  }>({});
  const [citations, setCitations] = useState<
    Array<{
      number: string;
      pmid: string;
      title: string;
      citations: number;
      summary?: string;
    }>
  >([]);
  const [formattedText, setFormattedText] = useState("");
  const [originalCitations, setOriginalCitations] = useState<
    Map<string, number>
  >(new Map());
  const [collapsedSections, setCollapsedSections] = useState<{
    [key: string]: boolean;
  }>({});
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [isAborting, setIsAborting] = useState(false);
  const [isSearchLocked, setIsSearchLocked] = useState(false);
  const [isUrlChange, setIsUrlChange] = useState(false);
  const [shouldTriggerSearch, setShouldTriggerSearch] = useState(true);
  const [isManualSearch, setIsManualSearch] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    publicationTypes: ["journal article", "review"],
    yearRange: [1900, new Date().getFullYear()],
    maxResults: 20,
    citationRange: [0, Infinity],
  });
  const updateURLParams = (params: {
    sortBy?: string;
    sortOrder?: string;
    yearMin?: number;
    yearMax?: number;
    citMin?: number;
    citMax?: number;
  }) => {
    const currentParams = new URLSearchParams(window.location.search);

    // Preserve existing query parameter
    const query = currentParams.get("q");

    // Create new URLSearchParams
    const searchParams = new URLSearchParams();
    if (query) searchParams.set("q", query);

    // Add new parameters
    if (params.sortBy) searchParams.set("sortBy", params.sortBy);
    if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
    if (params.yearMin) searchParams.set("yearMin", params.yearMin.toString());
    if (params.yearMax) searchParams.set("yearMax", params.yearMax.toString());
    if (params.citMin) searchParams.set("citMin", params.citMin.toString());
    if (params.citMax) searchParams.set("citMax", params.citMax.toString());

    // Update URL without triggering page refresh
    window.history.replaceState(
      null,
      "",
      `${AppRoutes.results}/?${searchParams.toString()}`
    );
  };

  // custom hook for saving search query
  const { saveSearchToHistory } = useSearchHistory();

  const { updateSearchHistory } = useSidebar();

  // Types
  interface TopDocumentResponse {
    documents: Document[];
  }

  interface DocumentSummariesResponse {
    documentSummaries: string[];
  }

  interface AgreablenessResponse {
    agreeableness: {
      [key: string]: {
        agree: number;
        disagree: number;
        neutral: number;
      };
    };
  }

  interface RelevantSectionsResponse {
    relevantSections: {
      [key: string]: {
        mostRelevantSentence: string;
        similarityScore: number;
      };
    };
  }

  interface OpenAIResponse {
    summary: string;
    documents: Document[];
  }

  interface EnrichResponse {
    documents: Document[];
  }

  interface SearchFilters {
    publicationTypes: string[];
    yearRange: [number, number];
    maxResults: number;
    citationRange: [number, number];
  }

  // Separate API calls into functions
  const fetchTopDocuments = async (
    query: string,
    filters: SearchFilters,
    signal?: AbortSignal
  ): Promise<Document[]> => {
    const params = new URLSearchParams({
      pub_types: filters?.publicationTypes.join(","),
      min_year: filters?.yearRange[0].toString(),
      max_year: filters?.yearRange[1].toString(),
      max_results: filters?.maxResults.toString(),
      min_citations: filters?.citationRange[0].toString(),
      max_citations:
        filters?.citationRange[1] === Infinity
          ? "999999"
          : filters?.citationRange[1].toString(), // Handle Infinity
    });

    const response = await fetch(
      `http://localhost:8000/query/${encodeURIComponent(
        query
      )}/?${params.toString()}`,
      { signal }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: TopDocumentResponse = await response.json();
    return data.documents || [];
  };

  const fetchSummary = async (
    query: string,
    documents: Document[],
    signal?: AbortSignal
  ): Promise<OpenAIResponse> => {
    const response = await fetch(
      `http://localhost:8000/openai/document-summary`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, documents }),
        signal,
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      summary: data.summary || "",
      documents: data.documents || [],
    };
  };

  const fetchDocumentSummaries = async (
    query: string,
    documents: Document[],
    signal?: AbortSignal
  ): Promise<DocumentSummariesResponse> => {
    const response = await fetch(
      `http://localhost:8000/openai/document-summaries`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, documents }),
        signal,
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return {
      documentSummaries: data.documentSummaries || [],
    };
  };

  const getAgreeableness = async (
    documents: Document[],
    signal?: AbortSignal
  ): Promise<Document[]> => {
    const response = await fetch(`http://localhost:8000/openai/agreeableness`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        documents,
        query: query,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AgreablenessResponse = await response.json();

    return documents.map((doc) => ({
      ...doc,
      citations: documents.find((originalDoc) => originalDoc.pmid === doc.pmid)
        ?.citations || { total: 0 },
      agreeableness: doc.pmid
        ? data.agreeableness[doc.pmid]
        : {
            agree: 0,
            disagree: 0,
            neutral: 0,
            entailmentModel: "default",
          },
    }));
  };

  const getRelevantSections = async (
    documents: Document[],
    query: string,
    signal?: AbortSignal
  ) => {
    const response = await fetch(
      `http://localhost:8000/enrich/relevant-sections`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documents,
          query,
        }),
        signal,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RelevantSectionsResponse = await response.json();
    return documents.map((doc) => ({
      ...doc,
      relevantSection: doc.pmid
        ? { ...data.relevantSections[doc.pmid], embeddingModel: "default" }
        : undefined,
    }));
  };

  const handleAbortSearch = async () => {
    if (abortControllerRef.current) {
      // 1. Set abort flags first
      setIsAborting(true);
      setIsSearchLocked(true);
      setShouldTriggerSearch(false);

      // 2. Reset loading states immediately
      setIsLoadingDocuments(false);
      setIsLoadingSummary(false);
      setIsLoadingEnrichment(false);
      setIsLoadingAgreeableness(false);

      // Clear everyhting after aborting
      setDocuments([]);
      setSummary("");
      setDocumentSummaries({});

      // 3. Abort the controller
      abortControllerRef.current.abort();
      abortControllerRef.current = null;

      // 4. Show notification
      enqueueSnackbar("Search cancelled", {
        variant: "error",
        autoHideDuration: 2000,
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
      });

      // 5. Reset flags after delay
      setTimeout(() => {
        setIsAborting(false);
        setIsSearchLocked(false);
        setShouldTriggerSearch(true);
      }, 300);
    }
  };

  // Function to load cached results
  const loadCachedResults = async (query: string) => {
    try {
      setIsLoadingDocuments(true);
      setIsLoadingSummary(true);
      setIsLoadingAgreeableness(true);
      setIsLoadingEnrichment(true);

      const response = await fetch(
        `http://localhost:8000/api/search-results/?query=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.status === 404) {
        return false; // No cached results
      }

      console.log("Cached results response:", response);

      if (response.ok) {
        const data = await response.json();
        console.log("Cached results data:", data);
        if (data) {
          // Update documents and summaries
          setDocuments(data.results.documents);
          console.log("Cached documents:", data.results.documents);
          setSummary(data.results.summary);
          setDocumentSummaries(data.results.documentSummaries);

          // Restore maps for citations
          setOriginalCitations(
            new Map(Object.entries(data.results.originalCitations))
          );
          setOriginalDocumentOrder(
            new Map(Object.entries(data.results.originalDocumentOrder))
          );

          // Reset loading states
          setIsLoadingDocuments(false);
          setIsLoadingSummary(false);
          setIsLoadingAgreeableness(false);
          setIsLoadingEnrichment(false);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error loading cached results:", error);
      return false;
    }
  };

  const createNewResults = async (
    query: string,
    documents: Document[],
    summary: string,
    documentSummaries: { [key: string]: string },
    originalDocumentOrder: Map<string, number>,
    originalCitations: Map<string, number>
  ) => {
    if (!token || !documents.length) {
      console.log("Cannot save: missing token or documents");
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 31);

      const response = await fetch(
        "http://localhost:8000/api/search-results/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query,
            results: {
              documents,
              summary,
              documentSummaries,
              originalDocumentOrder: Object.fromEntries(originalDocumentOrder),
              originalCitations: Object.fromEntries(originalCitations),
            },
            expires_at: expiresAt.toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save new results");
      }
    } catch (error) {
      console.error("Error saving new results:", error);
    }
  };

  const updateExistingResults = async (
    query: string,
    documents: Document[],
    summary: string,
    documentSummaries: { [key: string]: string },
    originalDocumentOrder: Map<string, number>,
    originalCitations: Map<string, number>
  ) => {
    if (!token || !documents.length) {
      console.log("Cannot update: missing token or documents");
      return;
    }

    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 31);

      const response = await fetch(
        `http://localhost:8000/api/search-results/?query=${encodeURIComponent(
          query
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query,
            results: {
              documents,
              summary,
              documentSummaries,
              originalCitations: Object.fromEntries(originalCitations),
              originalDocumentOrder: Object.fromEntries(originalDocumentOrder),
            },
            expires_at: expiresAt.toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update results");
      }
    } catch (error) {
      console.error("Error updating results:", error);
    }
  };

  const incrementQuestionCountDebounced = debounce(async () => {
    if (isIncrementing.current) return; // Prevent duplicate calls

    try {
      isIncrementing.current = true; // Set the flag to true

      // Update total question count
      const questionCountResponse = await fetch(
        "http://localhost:8000/api/user/increment-questions/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!questionCountResponse.ok) {
        throw new Error("Failed to increment total question count");
      }

      const questionCountData = await questionCountResponse.json();
      console.log(
        "Question count updated:",
        questionCountData.number_questions
      );

      // Update the user context with the new question count
      setUser({
        ...user!,
        number_questions: questionCountData.number_questions,
      });

      // Update daily question count
      const dailyCountResponse = await fetch(
        "http://localhost:8000/api/user/daily-questions/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!dailyCountResponse.ok) {
        throw new Error("Failed to update daily question count");
      }

      const dailyCountData = await dailyCountResponse.json();
      console.log(
        `Daily question count updated: ${dailyCountData.date} - ${dailyCountData.count}`
      );
    } catch (error) {
      console.error("Error updating question counts:", error);
    } finally {
      isIncrementing.current = false; // Reset the flag
    }
  }, 1000);

  const searchNewDocuments = debounce(async (query: string) => {
    if (!query || isAborting || isSearchLocked) return;

    // Only try to load from cache if user is authenticated
    if (token && !overwriteCache) {
      const hasCachedResults = await loadCachedResults(query);
      if (hasCachedResults) {
        return;
      }
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 1. Create abort controller
    const newController = new AbortController();
    abortControllerRef.current = newController;
    //setIsAborting(false);
    setIsSearchLocked(true);

    // 2. Set all loading states
    setIsLoadingDocuments(true);
    setIsLoadingSummary(true);
    setIsLoadingAgreeableness(true);
    setIsLoadingEnrichment(true);

    try {
      if (newController.signal.aborted) return;

      updateRouteParams(query);

      if (!overwriteCache) {
        await saveSearchToHistory(query);
        await updateSearchHistory();
      }

      incrementQuestionCountDebounced();

      const filtersToUse = searchFilters;

      const topDocs = await fetchTopDocuments(
        query,
        filtersToUse,
        newController.signal
      );
      if (newController.signal.aborted) return;

      // Store document metadata immediately after fetch
      const citationMap = new Map<string, number>();
      const orderMap = new Map<string, number>();

      topDocs.forEach((doc, index) => {
        if (doc.pmid) {
          if (doc.citations?.total) {
            citationMap.set(doc.pmid, doc.citations.total);
          }
          orderMap.set(doc.pmid, index + 1);
        }
      });

      setOriginalCitations(citationMap);
      setOriginalDocumentOrder(orderMap);
      setDocuments(topDocs);
      setIsLoadingDocuments(false);

      try {
        // Step 1: Get summary
        const summaryResponse = await fetchSummary(
          query,
          topDocs,
          newController.signal
        );
        if (newController.signal.aborted) return;
        setSummary(summaryResponse.summary);
        setIsLoadingSummary(false);

        // Step 2: Get document summaries
        const documentSummariesResponse = await fetchDocumentSummaries(
          query,
          topDocs,
          newController.signal
        );
        if (newController.signal.aborted) return;

        const summariesMap: { [key: string]: string } = {};
        documentSummariesResponse.documentSummaries.forEach(
          (summary, index) => {
            if (topDocs[index].pmid) {
              summariesMap[topDocs[index].pmid!] = summary;
            }
          }
        );
        setDocumentSummaries(summariesMap);

        // Step 3: Get agreeableness
        const agreeableness = await getAgreeableness(
          topDocs,
          newController.signal
        );
        if (newController.signal.aborted) return;
        setDocuments(agreeableness);
        setIsLoadingAgreeableness(false);

        //Step 3: Enrich documents
        try {
          const enrichedDocs = await getRelevantSections(
            agreeableness,
            query,
            newController.signal
          );
          if (newController.signal.aborted) return;
          setDocuments(enrichedDocs);
          setIsLoadingEnrichment(false);

          // Save results after all data is available
          if (overwriteCache) {
            await updateExistingResults(
              query,
              enrichedDocs,
              summaryResponse.summary,
              summariesMap,
              orderMap,
              citationMap
            );
          } else {
            await createNewResults(
              query,
              enrichedDocs,
              summaryResponse.summary,
              summariesMap,
              orderMap,
              citationMap
            );
          }
        } catch (error) {
          console.error("Enrichment error:", error);
        }
      } catch (error) {
        console.error("Summary fetch error:", error);
        setEncounteredError(true);
      } finally {
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Search aborted");
        setIsAborting(false);
        return;
      }
      console.error("Error:", error);
      setEncounteredError(true);
    } finally {
      if (!newController.signal.aborted) {
        setHasSearched(true);
      }
      setIsSearchLocked(false);
    }
  }, 1000);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const queryParam = searchParams.get("q");
    //console.log("Location changed:", { queryParam, locationState });

    // First update filters if they exist
    if (locationState?.filters) {
      console.log("Setting filters:", locationState.filters);
      setSearchFilters(locationState.filters);
    }

    // Then perform search with current filters
    if (queryParam && !isAborting && !isSearchLocked) {
      console.log("Triggering search with filters:", searchFilters);
      searchNewDocuments(queryParam);
    }
  }, [location]); // Depend on full location to catch both search and state changes

  // Route update
  const updateRouteParams = (query: string) => {
    setIsUrlChange(true);
    navigate(`${AppRoutes.results}/?q=${encodeURIComponent(query)}`);
  };

  const scrollToDocument = (pmid: string) => {
    // Find the current position of document with this PMID
    const position = documentOrderMap.get(pmid);
    if (position) {
      const element = document.getElementById(`document-${position}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block:"center" });
      }
    }
  };

  const handleToggleSimilarity = () => {
    if (sortBySimilarity) {
      // If already sorting by similarity, just toggle order
      setSortOrder(
        sortOrder === SORT_ASCENDING ? SORT_DESCENDING : SORT_ASCENDING
      );
    } else {
      // If switching to similarity, set it as active and use descending
      setSortBySimilarity(true);
      setSortByCitations(false);
      setSortByYear(false);
      setSortOrder(SORT_DESCENDING);
    }

    updateURLParams({
      sortBy: "similarity",
      sortOrder:
        sortBySimilarity && sortOrder === SORT_ASCENDING
          ? SORT_DESCENDING
          : SORT_ASCENDING,
    });
  };

  const handleToggleYear = () => {
    if (sortByYear) {
      // If already sorting by year, just toggle order
      setSortOrder(
        sortOrder === SORT_ASCENDING ? SORT_DESCENDING : SORT_ASCENDING
      );
    } else {
      // If switching to year, set it as active and use descending
      setSortByYear(true);
      setSortByCitations(false);
      setSortBySimilarity(false);
      setSortOrder(SORT_DESCENDING);
    }

    updateURLParams({
      sortBy: "year",
      sortOrder:
        sortByYear && sortOrder === SORT_ASCENDING
          ? SORT_DESCENDING
          : SORT_ASCENDING,
    });
  };

  const handleToggleCitations = () => {
    if (sortByCitations) {
      // If already sorting by citations, just toggle order
      setSortOrder(
        sortOrder === SORT_ASCENDING ? SORT_DESCENDING : SORT_ASCENDING
      );
    } else {
      // If switching to citations, set it as active and use descending
      setSortByCitations(true);
      setSortByYear(false);
      setSortBySimilarity(false);
      setSortOrder(SORT_DESCENDING);
    }

    updateURLParams({
      sortBy: "citations",
      sortOrder:
        sortByCitations && sortOrder === SORT_ASCENDING
          ? SORT_DESCENDING
          : SORT_ASCENDING,
    });
  };

  const handleApplyFilters = (newFilters: SearchFilters) => {
    console.log("Applying new filters:", newFilters);
    setSearchFilters(newFilters);
    // if (query) {
    //   searchNewDocuments(query);
    // }
  };

  // const handleApplyFilters = (newFilters: any) => {
  //   setSearchFilters(newFilters);
  //   if (query) {
  //     searchNewDocuments(query);
  //   }
  // };

  // 3. Add effect to read URL parameters on load
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder") as "asc" | "desc" | null;

    if (sortBy === "year") {
      setSortByYear(true);
      setSortByCitations(false);
      setSortBySimilarity(false);
    } else if (sortBy === "citations") {
      setSortByCitations(true);
      setSortByYear(false);
      setSortBySimilarity(false);
    } else if (sortBy === "similarity") {
      setSortBySimilarity(true);
      setSortByYear(false);
      setSortByCitations(false);
    }

    if (sortOrder) {
      setSortOrder(sortOrder);
    }
  }, [location.search]);

  // Sorted documents tracking filtered documents
  const sortedDocuments = useMemo(() => {
    const docsToSort =
      filteredDocuments.length > 0 ? filteredDocuments : documents || [];

    if (!sortByYear && !sortByCitations && !sortBySimilarity) {
      return docsToSort;
    }

    return [...docsToSort].sort((a, b) => {
      if (sortBySimilarity) {
        // Correctly access similarity
        const simA = a.similarity || 0;
        const simB = b.similarity || 0;
        // Reverse order for similarity (higher scores first)
        return sortOrder === SORT_ASCENDING ? simA - simB : simB - simA;
      }
      if (sortByYear) {
        const yearA = parseInt(a.publicationDate || "0");
        const yearB = parseInt(b.publicationDate || "0");
        return sortOrder === SORT_ASCENDING ? yearA - yearB : yearB - yearA;
      }
      if (sortByCitations) {
        const citA = a.citations?.total || 0;
        const citB = b.citations?.total || 0;
        return sortOrder === SORT_ASCENDING ? citA - citB : citB - citA;
      }

      return 0;
    });
  }, [
    documents,
    filteredDocuments,
    sortByYear,
    sortByCitations,
    sortBySimilarity,
    sortOrder,
  ]);

  const resetFilters = () => {
    setActiveFilters({});
    setFilteredDocuments([]);
  };

  const SortControls = () => (
    <Box sx={{ display: "flex", gap: 1, mb: 2, pl: 2 }}>
      <Chip
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            Similarity
            {sortBySimilarity &&
              (sortOrder === SORT_ASCENDING ? (
                <KeyboardArrowUp sx={{ fontSize: 18 }} />
              ) : (
                <KeyboardArrowDown sx={{ fontSize: 18 }} />
              ))}
          </Box>
        }
        onClick={handleToggleSimilarity}
        variant={sortBySimilarity ? "filled" : "outlined"}
        sx={{
          color: sortBySimilarity ? colors.white : colors.black,
          backgroundColor: sortBySimilarity
            ? colors.mainColorHover
            : colors.whiteGray,
          "&:hover": {
            backgroundColor: sortBySimilarity
              ? colors.mainColor
              : colors.darkGray,
          },
        }}
      />
      <Chip
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            Year
            {sortByYear &&
              (sortOrder === SORT_ASCENDING ? (
                <KeyboardArrowUp sx={{ fontSize: 18 }} />
              ) : (
                <KeyboardArrowDown sx={{ fontSize: 18 }} />
              ))}
          </Box>
        }
        onClick={handleToggleYear}
        variant={sortByYear ? "filled" : "outlined"}
        sx={{
          color: sortByYear ? colors.white : colors.black,
          backgroundColor: sortByYear
            ? colors.mainColorHover
            : colors.whiteGray,
          "&:hover": {
            backgroundColor: sortByYear ? colors.mainColor : colors.darkGray,
          },
        }}
      />
      <Chip
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            Citations
            {sortByCitations &&
              (sortOrder === SORT_ASCENDING ? (
                <KeyboardArrowUp sx={{ fontSize: 18 }} />
              ) : (
                <KeyboardArrowDown sx={{ fontSize: 18 }} />
              ))}
          </Box>
        }
        onClick={handleToggleCitations}
        variant={sortByCitations ? "filled" : "outlined"}
        sx={{
          color: sortByCitations ? colors.white : colors.black,
          backgroundColor: sortByCitations
            ? colors.mainColorHover
            : colors.whiteGray,
          "&:hover": {
            backgroundColor: sortByCitations
              ? colors.mainColor
              : colors.darkGray,
          },
        }}
      />
    </Box>
  );

  useEffect(() => {
    const newOrderMap = new Map<string, number>();
    let hasChanges = false;

    sortedDocuments.forEach((doc, index) => {
      if (doc.pmid) {
        const newPosition = index + 1;
        const currentPosition = documentOrderMap.get(doc.pmid);
        if (currentPosition !== newPosition) {
          hasChanges = true;
        }
        newOrderMap.set(doc.pmid, newPosition);
      }
    });

    if (hasChanges) {
      setDocumentOrderMap(newOrderMap);
    }
  }, [sortedDocuments, documentOrderMap]);

  const handleSearch = (query: string, isManual: boolean) => {
    setIsManualSearch(isManual);
    if (isManual) {
      navigate(`${AppRoutes.results}/?q=${query}`, {
        state: {
          isManualSearch: false,
          shouldSearch: false,
          searchQuery: query,
          overwriteCache: false,
        },
      });
    }
  };

  // Create pmidMap for document references
  const pmidMap = new Map<number, { pmid: string; title: string }>();
  documents.forEach((doc) => {
    if (doc.pmid) {
      const originalPosition = originalDocumentOrder.get(doc.pmid);
      if (originalPosition) {
        pmidMap.set(originalPosition, {
          pmid: doc.pmid,
          title: doc.title || "",
        });
      }
    }
  });

  useEffect(() => {
    const handleChipClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const chipElement = target.closest(".chip");
      if (chipElement) {
        const docLink = chipElement.closest(".document-link") as HTMLElement;
        if (docLink) {
          const pmid = docLink.getAttribute("data-pmid");
          if (pmid) {
            console.log("Scrolling to document:", pmid);
            scrollToDocument(pmid);
          }
        }
      }
    };

    document.addEventListener("click", handleChipClick);
    return () => document.removeEventListener("click", handleChipClick);
  }, [documentOrderMap]); // Add documentOrderMap as dependency

  const CitationChip = ({
    number,
    title,
    pmid,
    citations,
    summary,
  }: {
    number: string;
    title: string;
    pmid: string;
    citations: number;
    summary?: string;
  }) => (
    <span
      className="document-link"
      style={{ cursor: "pointer" }}
      data-pmid={pmid}
    >
      <Tooltip
        sx={{ backgroundColor: colors.darkGray }}
        title={
          <React.Fragment>
            <Typography sx={{ fontSize: "16px", fontWeight: "bold" }}>
              {title}
            </Typography>
            {summary && (
              <Typography sx={{ fontSize: "15px", mt: 1, color: "#e0e0e0" }}>
                {summary}
              </Typography>
            )}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mt: 0.5,
                width: "100%",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{ fontSize: "15px" }}>
                {citations} citations
              </Typography>
              <LaunchIcon
                onClick={() => navigate(`/documents/${pmid}`)}
                sx={{
                  marginLeft: "auto",
                  fontSize: 16,
                  cursor: "pointer",
                  opacity: 0.8,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: colors.mainColorHover,
                  },
                }}
              />
            </Box>
          </React.Fragment>
        }
        enterDelay={200}
        arrow
      >
        <span
          className="chip"
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: "24px",
            padding: "0 8px",
            fontSize: "0.8125rem",
            lineHeight: "1",
            borderRadius: "16px",
            backgroundColor: colors.mainColorHover,
            color: "white",
            cursor: "pointer",
          }}
        >
          {number}
        </span>
      </Tooltip>
    </span>
  );

  const formatSummary = (text: string) => {
    let sectionCount = 0;
    return (
      text
        // Format headers with less spacing
        .replace(/### (.*?)(?=\n|$)/g, (_, title) => {
          sectionCount++;
          const sectionId = `section-${sectionCount}`;
          const isCollapsed = collapsedSections[sectionId] ?? false; // Default to collapsed
          return `
            <div class="section-header" data-section="${sectionId}">
              <h3 style="color: black; margin: 16px 0 8px; cursor: pointer; display: flex; align-items: center;">
                <span class="collapse-icon" style="margin-right: 8px;">
                  ${isCollapsed ? "▸" : "▾"}
                </span>
                ${title}
              </h3>
              <div class="section-content" style="display: ${
                isCollapsed ? "none" : "block"
              }">
            `;
        })
        // Close each section properly before the next heading
        .split(/(?=<div class="section-header")/)
        .map((section) => (section.trim() ? `${section}</div></div>` : section))
        .join("\n")
        // Format paragraphs with less spacing
        .replace(/\n\n(.*?)\n\n/g, '<p style="margin: 8px 0">$1</p>')
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/- (.*?)(\n|$)/g, '<li style="margin: 4px 0">$1</li>')
        .replace(
          /(<li.*?<\/li>)+/g,
          '<ul style="list-style-type: disc; padding-left: 24px; margin: 8px 0">$&</ul>'
        )
        // Remove multiple line breaks
        .replace(/\n+/g, " ")
        // Handle citations
        .replace(/\[(\d+)\]/g, (match, number) => {
          const docInfo = pmidMap.get(parseInt(number));
          return docInfo
            ? `<span class="citation-placeholder" 
              data-number="${number}" 
              data-pmid="${docInfo.pmid}" 
              data-title="${docInfo.title.replace(/"/g, "&quot;")}"
              data-summary="${(documentSummaries[docInfo.pmid] || "").replace(
                /"/g,
                "&quot;"
              )}"
              ></span>`
            : match;
        })
        .split("\n")
        .filter((line) => line.trim() !== "")
        .join("")
    );
  };

  useEffect(() => {
    const placeholders = document.querySelectorAll(".citation-placeholder");
    placeholders.forEach((placeholder) => {
      const number = placeholder.getAttribute("data-number");
      const pmid = placeholder.getAttribute("data-pmid");
      const title = placeholder.getAttribute("data-title");
      const summary = placeholder.getAttribute("data-summary");
      const citations =
        documents.find((doc) => doc.pmid === pmid)?.citations?.total ||
        originalCitations.get(pmid || "") ||
        0;

      if (number && pmid && title) {
        ReactDOM.render(
          <CitationChip
            number={number}
            title={title}
            pmid={pmid}
            citations={citations}
            summary={summary || undefined}
          />,
          placeholder
        );
      }
    });

    return () => {
      placeholders.forEach((placeholder) => {
        ReactDOM.unmountComponentAtNode(placeholder);
      });
    };
  }, [
    summary,
    documents,
    documentSummaries,
    originalCitations,
    collapsedSections,
  ]);

  useEffect(() => {
    const handleSectionClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click was on citation or its children
      if (target.closest(".chip") || target.closest(".citation-placeholder")) {
        return; // Don't collapse section if citation was clicked
      }

      const header = (event.target as HTMLElement).closest(".section-header");
      if (header) {
        const sectionId = header.getAttribute("data-section");
        if (sectionId) {
          setCollapsedSections((prev) => ({
            ...prev,
            [sectionId]: !prev[sectionId],
          }));
        }
      }
    };

    document.addEventListener("click", handleSectionClick);
    return () => document.removeEventListener("click", handleSectionClick);
  }, []);

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
      <Box sx={{ width: "100%" }}>
        <Box
          sx={{
            position: "sticky",
            top: "64px",
            zIndex: 1000,
            paddingBottom: "24px",
            marginBottom: "24px",
            width: "100%",
          }}
        >
          <SearchBar
            onSearch={handleSearch}
            onAbort={handleAbortSearch}
            searchItem={query}
            isLoading={
              isLoadingDocuments || isLoadingSummary || isLoadingEnrichment
            }
            isAborting={isAborting}
            isLocked={isSearchLocked}
            onOpenFilters={() => setFilterModalOpen(true)}
            //hasActiveFilters={hasActiveFilters}
          />
          <SearchFilterModal
            open={filterModalOpen}
            onClose={() => setFilterModalOpen(false)}
            filters={searchFilters}
            onApplyFilters={handleApplyFilters}
          />
        </Box>
        {(documents.length > 0 || isLoadingDocuments) && (
          <Box sx={{ width: "100%" }}>
            <Summary
              summary={
                <div
                  dangerouslySetInnerHTML={{
                    __html: formatSummary(summary),
                  }}
                />
              }
              isLoadingSummary={isLoadingSummary}
            />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              <AgreeMeter
                documents={documents}
                isLoadingAgreeableness={isLoadingAgreeableness}
              />
              <ChartMeter
                documents={documents}
                isLoadingAgreeableness={isLoadingAgreeableness}
                documentOrderMap={documentOrderMap}
              />
            </Box>
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
              Referenced documents
            </Typography>
            {/* Sorting handles */}
            <SortControls />
          </Box>
        )}
        {/* Results Section */}
        {/* Document Results */}
        <Box sx={{ width: "100%" }}>
          {sortedDocuments.map((result, index) => (
            <div
              key={`doc-${result.pmid || index}`}
              id={`document-${documentOrderMap.get(result.pmid || "")}`}
              className="results-column"
            >
              <PaperTile
                isLoadingDocuments={isLoadingDocuments}
                isLoadingAgreeableness={isLoadingAgreeableness}
                pmid={result.pmid || ""}
                title={result.title || ""}
                abstract={result.abstract || ""}
                publicationDate={result.publicationDate || ""}
                query={query}
                aiSummary={documentSummaries[result.pmid || ""]}
                relevantSection={result.relevantSection}
                agreeableness={
                  typeof result.agreeableness === "number"
                    ? {
                        agree: undefined,
                        disagree: undefined,
                        neutral: undefined,
                        entailmentModel: "default",
                      }
                    : result.agreeableness ?? {
                        agree: undefined,
                        disagree: undefined,
                        neutral: undefined,
                        entailmentModel: "default",
                      }
                }
                citations={
                  result.pmid
                    ? {
                        total:
                          originalCitations.get(result.pmid) ||
                          result.citations?.total ||
                          0,
                      }
                    : { total: 0 }
                }
                orderNumber={originalDocumentOrder.get(result.pmid || "")}
              />
            </div>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
export default ResultPage;
