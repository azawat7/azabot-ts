import { JWTPayload } from "jose";

export interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
}

export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface SessionUser {
  id: string;
  username: string;
  avatar: string | null;
}

export interface CustomJWTPayload extends JWTPayload {
  user: SessionUser;
}

export interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  sessionId: string | null;
  hasValidDiscordToken: boolean;
}

export interface UseAuthReturn extends AuthState {
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}
