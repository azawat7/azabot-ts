import { ConnectOptions } from "mongoose";

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

export const REDIS_CACHE_TTL: Record<RepositoryName, number> = {
  Guild: 10 * 60, // 10 minutes
  GuildMember: 5 * 60, // 5 minutes
  Session: 10 * 60, // 5 minutes
  User: 5 * 60, // 5 minutes
};

export const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in ms
export const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export const DEFAULT_RETRY_OPTIONS_VALUES = {
  maxAttempts: 2,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

export const BATCH_SIZE = 1000; // 1k keys per operation
export const TTL_JITTER = 0.1; // 10%
