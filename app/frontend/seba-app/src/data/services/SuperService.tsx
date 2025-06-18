import { restClient } from "../api/config/axiosConfig";
import axios, { AxiosRequestConfig } from "axios";
import { APIError } from "../models/ApiError";
import FormData from "form-data";
import { objToQueryString } from "../utils/URLEncoder";
import { HttpMethod } from "../constants/Constants";

// Purpose: Provides a base class for API service classes, defining common methods for handling API requests.

export default class SuperService {
  constructor() {
    restClient.defaults.xsrfHeaderName = "X-CSRFToken";
    restClient.defaults.xsrfCookieName = "csrftoken";
    restClient.defaults.withCredentials = true;
  }

  //Executes API requests to the server.
  async handleRequest(
    method: string,
    url: string,
    data: JSON | undefined,
    callback: (response: any) => void
  ) {
    let hostUrl = restClient.defaults.baseURL;
    var config = await this.setupPayload(method, url, hostUrl, data);

    await restClient
      .request(config)
      .then((response) => {
        // Handle the response
        callback(response.data);
      })
      .catch((error) => {
        // Handle the error
        this.handleConnectionError(error, callback);
        const statusCode = error.response?.status;

        callback(
          new APIError(
            statusCode === 503 ? "Server Error" : error?.response?.data?.message
          )
        );
      });
  }

  async setupPayload(
    method: string,
    url: string,
    hostUrl?: string,
    data?: JSON | FormData
  ): Promise<AxiosRequestConfig> {
    const token = localStorage.getItem("token");
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    
    let config: AxiosRequestConfig = {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        'Content-Type': 'application/json',
        ...(method !== 'GET' && { 'X-CSRFToken': csrfToken }),
      },
      withCredentials: true,
      xsrfCookieName: 'csrftoken',
      xsrfHeaderName: 'X-CSRFToken'
    };

    if (method === HttpMethod.GET) {
      let params = objToQueryString(data);
      config = {
        ...config,
        method,
        baseURL: hostUrl,
        url: params ? url + "?" + params : url,
      };
    } else {
      let isFormData = data instanceof FormData;
      config = {
        ...config,
        method,
        baseURL: hostUrl,
        url,
        ...(data && {
          data: isFormData ? data : JSON.stringify(data),
        }),
      };
    }
    return config;
  }

  // Checks for issues related to network connectivity.
  checkConnectionIssues(error: any) {
    let hasNoResponse =
      error?.response === null || error?.response === undefined;
    let hasRequest = error?.request !== null && error?.request !== undefined;
    let wasCancelled = axios.isCancel(error);

    return (hasRequest && hasNoResponse) || wasCancelled;
  }

  // Manages errors related to network connectivity.
  handleConnectionError(error: any, callback: (response: any | any) => void) {
    let hasConnectionIssues = this.checkConnectionIssues(error);
    if (hasConnectionIssues) {
      this.handleNoInternet(callback);
    } else {
      this.handleGeneralError(error, callback);
    }
  }

  handleNoInternet(callback: (response: any | any) => void) {
    // Handle no_internet_connection
  }

  handleGeneralError(error: any, callback?: (response: any | any) => void) {
    // Handle general error
  }
}
