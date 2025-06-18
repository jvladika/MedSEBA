import axios from 'axios';
import SuperService from './SuperService';
import { API_Endpoints, API_base_URL } from "../constants/Endpoints";
import { HttpMethod } from "../constants";

export default class PdfService extends SuperService {
  async fetchPdf(pmid: string, callback: (data: Blob, error?: any) => void) {
    const endpoint = API_base_URL + API_Endpoints.documents.fetchPdf.replace("{pmid}", pmid);
    try {
        const response = await axios.get(endpoint, { responseType: 'blob' });
        callback(response.data);
    } catch (error) {
        console.error('Error fetching PDF:', error);
        callback(null as any, error);
    }
  }
}