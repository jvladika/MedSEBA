//Definim enum-ul care contine path-ul pentru rutele din app
export const enum AppRoutes {
  landing = "/",
  results = "/results",
  faq = "/faq",
  login = "/login",
  // TODO: add list
  signup = "/signup",
  documentsCreate = "/documents/create",
  documentsDetail = "/documents/:id",
  documentsDemo = "/documents/metadata/:pmid",
  bookmarks = "/bookmarks",
  bookmarkDetail = "/bookmarks/:document_id",
  bookmarkCreate = "/bookmarks/create",
  bookmarkDelete = "/bookmarks/:document_id/delete",
  highlightsCreate = "/highlights",
  highlightDetail = "/highlights/:document_id",
  highlightUpdate = "/highlights/:highlight_id/update",
  highlightDelete = "/highlights/:highlight_id/delete",
  highlightDeleteAll = "/highlights/:document_id/delete-all",
  commentsCreate = "/comments",
  commentList = "/comments/:document_id",
  commentUpdate = "/comments/:comment_id/update",
  commentDelete = "/comments/:comment_id/delete",
  commentDeleteAll = "/comments/:document_id/delete-all"
}
