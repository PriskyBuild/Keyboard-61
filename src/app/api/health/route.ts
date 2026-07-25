// MIT License — Piano Learning App
// Trivial health-check endpoint used by Vercel uptime probes.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    time: Date.now(),
    service: "piano-learning-app",
  });
}
