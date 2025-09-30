export enum DatabaseErrorCode {
  CONNECTION_FAILED = "CONNECTION_FAILED",
  CONNECTION_TIMEOUT = "CONNECTION_TIMEOUT",
  QUERY_FAILED = "QUERY_FAILED",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  DUPLICATE_KEY = "DUPLICATE_KEY",
  NOT_FOUND = "NOT_FOUND",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  UNKNOWN = "UNKNOWN",
}

export class DatabaseError extends Error {
  constructor(
    public code: DatabaseErrorCode,
    message: string,
    public originalError?: any,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = "DatabaseError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ConnectionError extends DatabaseError {
  constructor(message: string, originalError?: any) {
    super(DatabaseErrorCode.CONNECTION_FAILED, message, originalError, true);
    this.name = "ConnectionError";
  }
}

export class ConnectionTimeoutError extends DatabaseError {
  constructor(message: string, originalError?: any) {
    super(DatabaseErrorCode.CONNECTION_TIMEOUT, message, originalError, true);
    this.name = "ConnectionTimeoutError";
  }
}

export class QueryError extends DatabaseError {
  constructor(message: string, originalError?: any, isRetryable = false) {
    super(DatabaseErrorCode.QUERY_FAILED, message, originalError, isRetryable);
    this.name = "QueryError";
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string, originalError?: any) {
    super(DatabaseErrorCode.VALIDATION_ERROR, message, originalError, false);
    this.name = "ValidationError";
  }
}

export class DuplicateKeyError extends DatabaseError {
  constructor(message: string, originalError?: any) {
    super(DatabaseErrorCode.DUPLICATE_KEY, message, originalError, false);
    this.name = "DuplicateKeyError";
  }
}

export function handleMongooseError(error: any): DatabaseError {
  if (error.name === "MongoNetworkError" || error.name === "MongoServerError") {
    return new ConnectionError(
      `Database connection failed: ${error.message}`,
      error
    );
  }

  if (error.name === "MongooseServerSelectionError") {
    return new ConnectionTimeoutError(
      `Database connection timeout: ${error.message}`,
      error
    );
  }

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors)
      .map((e: any) => e.message)
      .join(", ");
    return new ValidationError(`Validation failed: ${messages}`, error);
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "field";
    return new DuplicateKeyError(
      `Duplicate value for ${field}: ${JSON.stringify(error.keyValue)}`,
      error
    );
  }

  if (error.name === "CastError") {
    return new ValidationError(
      `Invalid value for ${error.path}: ${error.value}`,
      error
    );
  }

  const retryableErrorCodes = [
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "ECONNREFUSED",
  ];
  const isRetryable = retryableErrorCodes.includes(error.code);

  return new QueryError(
    error.message || "Database query failed",
    error,
    isRetryable
  );
}

export function isDatabaseError(error: any): error is DatabaseError {
  return error instanceof DatabaseError;
}

export function isRetryableError(error: any): boolean {
  return isDatabaseError(error) && error.isRetryable;
}
