import { SessionManager } from "@/app/lib/auth";
import { withSecurity } from "@/app/lib/security";
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
