import SuperService from "./SuperService";
import { HttpMethod } from "../constants";
import { API_Endpoints, API_base_URL } from "../constants/Endpoints";
import { Comment } from "../models/Comment";

export default class CommentService extends SuperService {
  
  async listComments(document_id: string, callback: (data: Comment[]) => void) {
    const endpoint = API_base_URL + API_Endpoints.comments.list.replace("{document_id}", document_id);
    await this.handleRequest(
      HttpMethod.GET,
      endpoint,
      undefined,
      callback
    );
  }

  async createComment(
    document_id: string,
    comment_text: string,
    line_number: number,
    callback: (data: Comment) => void
  ) {
    await this.handleRequest(
      HttpMethod.POST,
      API_base_URL + API_Endpoints.comments.create,
      {
        document_id,
        comment_text,
        line_number
      } as unknown as JSON,
      callback
    );
  }

  async updateComment(
    comment_id: number,
    data: Partial<Comment>,
    callback: () => void
  ) {
    const endpoint = API_base_URL + API_Endpoints.comments.update.replace(
      "{comment_id}",
      comment_id.toString()
    );
    await this.handleRequest(HttpMethod.PUT, endpoint, data as unknown as JSON, callback);
  }

  async deleteComment(comment_id: number, callback: () => void) {
    const endpoint = API_base_URL + API_Endpoints.comments.delete.replace(
      "{comment_id}",
      comment_id.toString()
    );
    await this.handleRequest(HttpMethod.DELETE, endpoint, undefined, callback);
  }

  async deleteAllComments(document_id: string, callback: () => void) {
    const endpoint = API_base_URL + API_Endpoints.comments.deleteAll.replace(
      "{document_id}",
      document_id
    );
    await this.handleRequest(HttpMethod.DELETE, endpoint, undefined, callback);
  }
} 