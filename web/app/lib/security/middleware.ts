import { NextRequest, NextResponse } from "next/server";
import { CSRFService } from "./csrf.service";
import { getClientIdentifier, getRateLimiter } from "./rate-limit.service";
import { logger } from "@shaw/utils";
import { CSRF_HEADER_NAME, RATE_LIMIT_CONFIGS } from "../config";

type SecurityHandler = (request: NextRequest) => Promise<NextResponse>;

interface WithCSRFOptions {
  methods?: string[];
}

interface WithRateLimitOptions {
  tier?: keyof typeof RATE_LIMIT_CONFIGS;
  identifier?: (request: NextRequest) => string;
}

export async function withCSRF(
  request: NextRequest,
  handler: SecurityHandler,
  options: WithCSRFOptions = {}
): Promise<NextResponse> {
  const { methods = ["POST", "PUT", "DELETE", "PATCH"] } = options;

  if (!methods.includes(request.method)) {
    return handler(request);
  }

  const csrfToken = request.headers.get(CSRF_HEADER_NAME);

  if (!csrfToken) {
    logger.warn("CSRF check failed: No token provided");
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "CSRF token missing",
      },
      { status: 403 }
    );
  }

  const isValid = await CSRFService.verifyToken(csrfToken);

  if (!isValid) {
    logger.warn("CSRF check failed: Invalid token");
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "Invalid CSRF token",
      },
      { status: 403 }
    );
  }

  return handler(request);
}

export async function withRateLimit(
  request: NextRequest,
  handler: SecurityHandler,
  options: WithRateLimitOptions = {}
): Promise<NextResponse> {
  const { tier = "moderate", identifier } = options;

  const clientId = identifier
    ? identifier(request)
    : getClientIdentifier(request);

  const rateLimiter = getRateLimiter(tier);
  const result = await rateLimiter.check(clientId);

  const addRateLimitHeaders = (response: NextResponse) => {
    response.headers.set(
      "X-RateLimit-Limit",
      rateLimiter.getStats().config.maxRequests.toString()
    );
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", result.resetAt.toString());
    return response;
  };

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);

    logger.warn(`Rate limit exceeded for ${clientId}`);

    const response = NextResponse.json(
      {
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter,
      },
      { status: 429 }
    );

    response.headers.set("Retry-After", retryAfter.toString());
    return addRateLimitHeaders(response);
  }

  const response = await handler(request);
  return addRateLimitHeaders(response);
}

export async function withSecurity(
  request: NextRequest,
  handler: SecurityHandler,
  options: {
    csrf?: boolean | WithCSRFOptions;
    rateLimit?: boolean | WithRateLimitOptions;
  } = {}
): Promise<NextResponse> {
  const { csrf = true, rateLimit = true } = options;

  let wrappedHandler = handler;

  if (csrf) {
    const csrfOptions = typeof csrf === "object" ? csrf : {};
    wrappedHandler = async (req: NextRequest) =>
      withCSRF(req, handler, csrfOptions);
  }

  if (rateLimit) {
    const rateLimitOptions = typeof rateLimit === "object" ? rateLimit : {};
    wrappedHandler = async (req: NextRequest) =>
      withRateLimit(req, handler, rateLimitOptions);
  }

  return wrappedHandler(request);
}
