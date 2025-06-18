import FormData from "form-data";
import { HttpMethod } from "../constants";
import { API_Endpoints, API_base_URL } from "../constants/Endpoints";
import { RemoteDocumentFilter } from "../../data/models/DocumentFilter";
import SuperService from "./SuperService";

export default class DocumentService extends SuperService {
  async getDocument(id: string, callback: any, query?: string) {
    let endpoint = API_base_URL + API_Endpoints.getDocument.replace("{id}", id);
    if (query) {
      endpoint += `?query=${query}`;
    }
    await this.handleRequest(HttpMethod.GET, endpoint, undefined, callback);
  }

  async getQuery(
    query: string,
    callback: any,
    remoteFilter?: RemoteDocumentFilter,
    numResults?: number,
    offset?: number,
    alpha?: number
  ): Promise<void> {
    let endpoint: string = API_base_URL + API_Endpoints.getQuery.replace(
      "{string}",
      encodeURIComponent(query)
    );
    const filterQuery: string | undefined = remoteFilter?.toQueryString();
    const queryParams: string[] = [];
    if (typeof numResults === "number") {
      queryParams.push(`numResults=${numResults}`);
    }
    if (typeof offset === "number") {
      queryParams.push(`offset=${offset}`);
    }
    if (typeof alpha === "number") {
      queryParams.push(`alpha=${alpha}`);
    }
    if (filterQuery && filterQuery !== "") {
      queryParams.push(filterQuery);
    }
    if (queryParams.length > 0) {
      endpoint += `?${queryParams.join("&")}`;
    }

    await this.handleRequest(HttpMethod.GET, endpoint, undefined, callback);
  }

  async postQueryFeedback(id: string, feedback: boolean, callback: any) {
    const queryParams = feedback === true ? "?isPositiveFeedback=1" : "";

    await this.handleRequest(
      HttpMethod.POST,
      API_base_URL + API_Endpoints.postQueryFeedback.replace("{id}", id) + queryParams,
      undefined,
      callback
    );
  }
}
