import { NextRequest, NextResponse } from "next/server";
import { SessionManager } from "@/app/lib/session-manager";

export async function POST(request: NextRequest) {
  await SessionManager.clearSession();
  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  await SessionManager.clearSession();
  return NextResponse.redirect(new URL("/", request.url));
}
