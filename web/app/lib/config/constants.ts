export const SESSION_COOKIE_NAME = "discord";
export const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds
export const STATE_COOKIE_NAME = "state";
export const STATE_COOKIE_DURATION = 5 * 60; // 5 minutes in seconds
export const JWT_EXPIRATION = "7d";
export const TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes in ms
export const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in ms

export const CSRF_TOKEN_NAME = "csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";
export const CSRF_TOKEN_LENGTH = 32;
export const CSRF_TOKEN_EXPIRY = 60 * 60; // 1 hour in seconds

export const RATE_LIMIT_CONFIGS = {
  strict: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute
  moderate: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 requests per minute
  relaxed: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 requests per 15 minutes
};
