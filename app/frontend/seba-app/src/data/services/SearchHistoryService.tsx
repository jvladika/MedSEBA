import SuperService from "./SuperService";
import { HttpMethod } from "../constants/Constants";
import { API_base_URL, API_Endpoints } from "../constants/Endpoints";
import { SearchHistoryItemType } from '../../ui/components/sideBar/types';

export default class SearchHistoryService extends SuperService {
    async getSearchHistory(callback: any) {
      await this.handleRequest(
        HttpMethod.GET,
        API_base_URL + '/api/search-history/',
        undefined,
        callback
      );
    }

    async saveSearch(query: string, callback: any) {
        await this.handleRequest(
            HttpMethod.POST,
            API_base_URL + '/api/search-history/',
            { query_text: query } as any,
            callback
        );
    }

    async deleteSearch(itemId: number, callback: () => void) {
      await this.handleRequest(
        HttpMethod.DELETE,
        API_base_URL + `/api/search-history/${itemId}/delete/`,
        undefined,
        callback
      );
    }

    // async updateSearch(itemId: number, data: { custom_title: string }): Promise<SearchHistoryItemType> {
    //   await this.handleRequest(
    //     HttpMethod.PUT,
    //     API_base_URL + `/api/search-history/${itemId}/`,
    //     data as unknown as JSON
    //   );
    // }

    async updateSearch(itemId: number, data: { custom_title: string }): Promise<SearchHistoryItemType> {
      return new Promise((resolve, reject) => {
        this.handleRequest(
          HttpMethod.PUT,
          API_base_URL + `/api/search-history/${itemId}/`,
          data as unknown as JSON,
          (response: SearchHistoryItemType) => {
            resolve(response);
          }
      )});
    }
}