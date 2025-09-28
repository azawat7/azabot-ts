import { jwtVerify, SignJWT } from "jose";
import { CustomJWTPayload, SessionUser } from "./types";

const JWT_SECRET = new TextEncoder().encode(process.env.WEB_AUTH_SECRET!);
const JWT_ALGORITHM = "HS256";
const JWT_EXPIRATION = "7d";

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
    console.log(error);
    return null;
  }
}

export function isJWTExpired(payload: CustomJWTPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  return payload.exp! < now;
}
