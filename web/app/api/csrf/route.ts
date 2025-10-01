import { NextRequest, NextResponse } from "next/server";
import { logger } from "@shaw/utils";
import { CSRFService, withRateLimit } from "@/app/lib/security";

export async function GET(request: NextRequest) {
  return withRateLimit(
    request,
    async () => {
      try {
        const token = await CSRFService.generateToken();

        return NextResponse.json({
          token,
          expiresIn: 3600,
        });
      } catch (error) {
        logger.error("Error generating CSRF token:", error);
        return NextResponse.json(
          {
            error: "Internal Server Error",
            message: "Failed to generate CSRF token",
          },
          { status: 500 }
        );
      }
    },
    { tier: "relaxed" }
  );
}
