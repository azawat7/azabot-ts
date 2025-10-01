import { ConnectOptions } from "mongoose";
import { CacheOptions } from "../utils/CacheManager";
import { RetryOptions } from "../utils/RetryUtils";

export type RepositoryName = "Guild" | "GuildMember" | "Session" | "User";

export const CONNECTION_OPTIONS: ConnectOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
  bufferCommands: false,
};

export const CACHE_DEFAULTS: CacheOptions = {
  maxSize: 1000,
  ttl: 5 * 60 * 1000,
};

export const REPO_CACHE_SETTINGS: Record<RepositoryName, CacheOptions> = {
  Guild: {
    ttl: 10 * 60 * 1000,
    maxSize: 5000,
  },
  GuildMember: {
    ttl: 5 * 60 * 1000,
    maxSize: 5000,
  },
  Session: {
    ttl: 5 * 60 * 1000,
    maxSize: 1000,
  },
  User: {
    ttl: 5 * 60 * 1000,
    maxSize: 5000,
  },
};

export const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in seconds
export const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes in seconds
export const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export const DEFAULT_RETRY_OPTIONS_VALUES = {
  maxAttempts: 2,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};
