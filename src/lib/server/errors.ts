/**
 * Thrown when there's a network-level failure connecting to an external service.
 */
export class ServiceConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceConnectionError';
  }
}

/**
 * Thrown when the service returns a non-OK HTTP status (e.g., 400 or 500).
 */
export class QueryFailedError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'QueryFailedError';
    this.statusCode = statusCode;
  }
}
