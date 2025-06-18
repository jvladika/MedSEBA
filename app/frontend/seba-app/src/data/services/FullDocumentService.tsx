import SuperService from "./SuperService";
import { HttpMethod } from "../constants";
import { API_Endpoints, API_base_URL } from "../constants/Endpoints";
import { FullDocument } from "../models/FullDocument";
export default class FullDocumentService extends SuperService {

  async listDocuments(callback: (data: FullDocument[]) => void) {
    const endpoint = API_base_URL + API_Endpoints.documents.list;
    await this.handleRequest(
      HttpMethod.GET,
      endpoint,
      undefined,
      callback
    );
  }

  async getDocument(id: string, callback: (data: FullDocument) => void) {
    const endpoint = API_base_URL + API_Endpoints.documents.get.replace("{id}", id);
    await this.handleRequest(HttpMethod.GET, endpoint, undefined, callback);
  }

  async getDocumentByPmid(pmid: string, callback: (data: FullDocument) => void) {
    const endpoint = API_base_URL + API_Endpoints.documents.getDocumentByPmid.replace("{pmid}", pmid);
    await this.handleRequest(HttpMethod.GET, endpoint, undefined, callback);
  }

  async createDocument(document: Partial<FullDocument>, callback: (data: FullDocument) => void) {
    await this.handleRequest(
      HttpMethod.POST,
      API_base_URL + API_Endpoints.documents.create,
      document as JSON,
      callback
    );
  }

  async updateDocument(id: string, updates: Partial<FullDocument>, callback: (data: FullDocument) => void) {
    const endpoint = API_base_URL + API_Endpoints.documents.update.replace("{id}", id);
    await this.handleRequest(HttpMethod.PUT, endpoint, updates as JSON, callback);
  }

  async deleteDocument(id: string, callback: () => void) {
    const endpoint = API_base_URL + API_Endpoints.documents.delete.replace("{id}", id);
    await this.handleRequest(HttpMethod.DELETE, endpoint, undefined, callback);
  }

  async getDocumentMetadata(pmid: string, callback: (data: FullDocument, error?: any) => void) {
    const endpoint = API_base_URL + API_Endpoints.documents.getDocumentMetadata.replace("{pmid}", pmid);
    await this.handleRequest(HttpMethod.GET, endpoint, undefined, callback);
  }

  async getPubmedDocumentMetadata(pmid: string, callback: (data: FullDocument, error?: any) => void) {
    const endpoint = API_base_URL + API_Endpoints.documents.getPubmedDocumentMetadata.replace("{pmid}", pmid);
    await this.handleRequest(HttpMethod.GET, endpoint, undefined, callback);
  }

  async getCitations(pmid: string, callback: (data: any) => void) {
    const endpoint = API_base_URL + API_Endpoints.documents.getDocumentCitations.replace("{pmid}", pmid);
    await this.handleRequest(HttpMethod.GET, endpoint, undefined, callback);
  }
}