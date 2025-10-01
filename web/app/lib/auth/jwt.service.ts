import { jwtVerify, SignJWT } from "jose";
import { CustomJWTPayload, SessionUser } from "../types";
import { logger } from "@shaw/utils";
import { env, JWT_EXPIRATION } from "../config";

const JWT_SECRET = new TextEncoder().encode(env.authSecret);
const JWT_ALGORITHM = "HS256";

export async function signJWT(
  user: SessionUser,
  sessionId: string
): Promise<string> {
  const jwt = await new SignJWT({ user, sessionId })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(JWT_SECRET);

  return jwt;
}

export async function verifyJWT(
  token: string
): Promise<CustomJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });

    return payload as CustomJWTPayload;
  } catch (error) {
    logger.error(error as string);
    return null;
  }
}

export function isJWTExpired(payload: CustomJWTPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  return payload.exp! < now;
}
