import SuperService from "./SuperService";
import { HttpMethod } from "../constants";
import { API_Endpoints, API_base_URL } from "../constants/Endpoints";
import { Highlight } from "../models/Highlight";

export default class HighlightService extends SuperService {
  async listHighlights(document_id: string, callback: (data: Highlight[]) => void) {
    const endpoint = API_base_URL + API_Endpoints.highlights.list.replace("{document_id}", document_id);
    await this.handleRequest(
      HttpMethod.GET,
      endpoint,
      undefined,
      callback
    );
  }

  async createHighlight(
    document_id: string,
    text: string,
    page_number: number,
    color: string = 'yellow',
    is_crossed_out: boolean = false,
    callback: (data: Highlight) => void
  ) {
    await this.handleRequest(
      HttpMethod.POST,
      API_base_URL + API_Endpoints.highlights.create,
      {
        document_id,
        text,
        page_number,
        color,
        is_crossed_out
      } as unknown as JSON,
      callback
    );
  }

  async updateHighlight(
    highlight_id: number,
    data: Partial<Highlight>,
    callback: () => void
  ) {
    const endpoint = API_base_URL + API_Endpoints.highlights.update.replace(
      "{highlight_id}",
      highlight_id.toString()
    );
    await this.handleRequest(HttpMethod.PUT, endpoint, data as unknown as JSON, callback);
  }

  async deleteHighlight(highlight_id: number, callback: () => void) {
    const endpoint = API_base_URL + API_Endpoints.highlights.delete.replace(
      "{highlight_id}",
      highlight_id.toString()
    );
    await this.handleRequest(HttpMethod.DELETE, endpoint, undefined, callback);
  }

  async deleteAllHighlights(document_id: string, callback: () => void) {
    const endpoint = API_base_URL + API_Endpoints.highlights.deleteAll.replace(
      "{document_id}",
      document_id
    );
    await this.handleRequest(HttpMethod.DELETE, endpoint, undefined, callback);
  }
} 