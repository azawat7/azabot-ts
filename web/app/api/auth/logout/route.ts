import { SessionManager } from "@/app/lib/auth";
import { withRateLimit, withSecurity } from "@/app/lib/security";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return withSecurity(
    request,
    async (req) => {
      await SessionManager.clearSession();
      return NextResponse.json({ success: true });
    },
    {
      csrf: true,
      rateLimit: { tier: "auth" },
    }
  );
}

export async function GET(request: NextRequest) {
  return withRateLimit(
    request,
    async () => {
      await SessionManager.clearSession();
      return NextResponse.redirect(new URL("/", request.url));
    },
    {
      tier: "auth",
    }
  );
}
