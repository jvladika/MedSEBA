//APIError model extending the built-in Error
export class APIError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "APIError";
  }
}
