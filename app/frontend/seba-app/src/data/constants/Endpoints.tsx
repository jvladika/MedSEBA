// Purpose: Sets up base URLs and API endpoints for different environments in the application.

// Base URLs setup for development and production environments in case there will be in the future.

const API_BASE_URL_DEV = "http://127.0.0.1:8000";
const API_BASE_URL_PROD = "http://127.0.0.1:8000";
const corsOffUrl = "https://thingproxy.freeboard.io/fetch/";

const Environment = {
  dev: "dev",
  prod: "prod",
};

// Determines the current running environment (default set to prod).
// Future updates should dynamically assign and detect this based on the environment it is running.
const env = Environment.prod;

// Defines the API base URL according to the selected environment.
export const API_base_URL = "http://localhost:8000"; //env === Environment.prod ? API_BASE_URL_PROD : corsOffUrl + API_BASE_URL_DEV;

// Collection of API endpoints.
export const API_Endpoints = {
  getDocument: "/document/{id}",
  getQuery: "/query/{string}",
  postQueryFeedback: "/query/feedback/{id}",
  getSummary: "/openai/summarize",
  searchHistory: '/api/search-history/',
  bookmarks: {
    list: "/bookmarks/",
    create: "/bookmarks/create/",
    get: "/bookmarks/{document_id}/",
    delete: "/bookmarks/{document_id}/delete/",
  },
  documents: {
    list: "/documents/",
    create: "/documents/create/",
    get: "/documents/{id}/",
    update: "/documents/{id}/update/",
    delete: "/documents/{id}/delete/",
    getDocumentMetadata: "/documents/metadata/{pmid}/",
    getPubmedDocumentMetadata: "/documents/metadata/pubmed/{pmid}/",
    getDocumentCitations: "/documents/metadata/citations/{pmid}/",
    fetchPdf: "/documents/fetch-pdf/{pmid}/",
    getDocumentByPmid: "/documents/by-pmid/{pmid}/",
  },
  highlights: {
    list: "/highlights/{document_id}/",
    create: "/highlights/",
    update: "/highlights/{highlight_id}/update/",
    delete: "/highlights/{highlight_id}/delete/",
    deleteAll: "/highlights/{document_id}/delete-all/"
  },
  comments: {
    list: "/comments/{document_id}/",
    create: "/comments/",
    update: "/comments/{comment_id}/update/",
    delete: "/comments/{comment_id}/delete/",
    deleteAll: "/comments/{document_id}/delete-all/"
  },
};
