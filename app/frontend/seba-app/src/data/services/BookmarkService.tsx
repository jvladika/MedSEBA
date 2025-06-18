import SuperService from "./SuperService";
import { HttpMethod } from "../constants";
import { API_Endpoints, API_base_URL } from "../constants/Endpoints";
import { Bookmark } from "../models/Bookmark";

export default class BookmarkService extends SuperService {

  async listBookmarks(callback: (data: Bookmark[]) => void) {
    await this.handleRequest(
      HttpMethod.GET,
      API_base_URL + API_Endpoints.bookmarks.list,
      undefined,
      callback
    );
  }

  async createBookmark(document_id: string, callback: (data: Bookmark) => void) {
    await this.handleRequest(
      HttpMethod.POST,
      API_base_URL + API_Endpoints.bookmarks.create,
      { document_id: document_id } as unknown as JSON,
      callback
    );
  }

  async getBookmark(document_id: string, callback: (data: Bookmark) => void) {
    const endpoint = API_base_URL + API_Endpoints.bookmarks.get.replace("{document_id}", document_id);
    await this.handleRequest(HttpMethod.GET, endpoint, undefined, callback);
  }

  async deleteBookmark(document_id: string, callback: () => void) {
    const endpoint = API_base_URL + API_Endpoints.bookmarks.delete.replace("{document_id}", document_id);
    await this.handleRequest(HttpMethod.DELETE, endpoint, undefined, callback);
  }
}
