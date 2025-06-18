import DocumentService from "../services/DocumentService";
import OpenAiService from "../services/OpenAiService";
import SearchHistoryService from "../services/SearchHistoryService";

import FullDocumentService from "../services/FullDocumentService";
import BookmarkService from "../services/BookmarkService";
import HighlightService from "../services/HighlightService";
import CommentService from "../services/CommentService";
import ProjectService from "../services/ProjectService";
// Purpose: Centralizes the instantiation and management of API services used throughout the application.

// - Each API service, like DocumentService, encapsulates specific API calls.
// - New API services should be added to both the APIServices type and the api object.
// - This approach ensures modularity and easy maintenance of API-related functionalities.
// - Exception: 'SuperService' is a base class extended by all other services and is not included here.

export type APIServices = {
  documentService: DocumentService;
  openAiService: OpenAiService;
  searchHistoryService: SearchHistoryService;
  fullDocumentService: FullDocumentService;
  bookmarkService: BookmarkService;
  highlightService: HighlightService;
  commentService: CommentService;
  projectService: ProjectService;
};

export const api: APIServices = {
  documentService: new DocumentService(),
  openAiService: new OpenAiService(),
  searchHistoryService: new SearchHistoryService(),
  fullDocumentService: new FullDocumentService(),
  bookmarkService: new BookmarkService(),
  highlightService: new HighlightService(),
  commentService: new CommentService(),
  projectService: new ProjectService(),
};

