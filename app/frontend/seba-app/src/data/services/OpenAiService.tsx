import SuperService from "./SuperService";
import { API_Endpoints, API_base_URL } from "../constants/Endpoints";
import { Document } from "../models/Document";

export default class OpenAiService extends SuperService {
  public async getOpenAISummary(
    documents: Array<Document>,
    callback: (response: any, error?: any) => void
  ): Promise<any> {
    const data: any = documents.map((document) => {
      return [
        document.identifier,
        document.abstract,
        {
          queryRelated: document.queryRelated,
        },
      ];
    });
    return await this.handleRequest(
      "POST",
      API_base_URL + API_Endpoints.getSummary,
      data,
      callback
    );
  }
}
