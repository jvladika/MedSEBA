import axios from "axios";
import { API_base_URL } from "../../constants/Endpoints";

// Purpose: Configures the axios library for API requests.

// - This file creates and configures an axios instance (restClient) for making HTTP requests.
// - The axios instance is configured with a baseURL (it stays constant and it is used for all calls)

// - The baseURL is defined in Endpoints.tsx.

export const restClient = axios.create({
  baseURL: API_base_URL,
});

// Custom errorHandler:
// Capture and logs the message from the API call to the console, primarily to assist with debugging.

const errorHandler = (error: any) => {
  const statusCode = error.response?.status;
  const message = error.response?.data?.message;

  if (message) {
    console.log(`ERROR: ${message}`);
  }
};

// Applying the response interceptor to the restClient.
// - The interceptor uses the errorHandler to handle errors in API responses.
restClient.interceptors.response.use(undefined, (error: any) => {
  return errorHandler(error);
});
