import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { tallyPayloadSchema } from "@/lib/tally-types";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function json(data: unknown, status = 200, extra: Record<string, string> = {}) {
  return NextResponse.json(data, { status, headers: { ...CORS_HEADERS, ...extra } });
}

function verifyToken(header: string | null, expected: string): boolean {
  const incoming = Buffer.from(header ?? "");
  const target = Buffer.from(`Bearer ${expected}`);
  if (incoming.length !== target.length) return false;
  return timingSafeEqual(incoming, target);
}

function handleStorageError(err: unknown): NextResponse {
  const message = err instanceof Error ? err.message : "Unknown error";
  console.error("[tally] storage error:", message);
  if (message.includes("UPSTASH") || message.includes("KV")) {
    return json({ ok: false, error: "KV store not connected." }, 500);
  }
  return json({ ok: false, error: "Storage error." }, 500);
}

// ---------- OPTIONS ----------

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// ---------- POST ----------

export async function POST(request: NextRequest) {
  const token = process.env.TALLY_API_TOKEN;
  if (!token) {
    return json({ ok: false, error: "TALLY_API_TOKEN not set" }, 500);
  }

  if (!verifyToken(request.headers.get("authorization"), token)) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const result = tallyPayloadSchema.safeParse(body);
  if (!result.success) {
    return json({ ok: false, error: "Validation failed", details: result.error.flatten() }, 422);
  }

  try {
    await kv.set(`tally:${result.data.date}`, result.data);
    await kv.set("tally:latest", result.data);
  } catch (err) {
    return handleStorageError(err);
  }

  return json({ ok: true });
}

// ---------- GET ----------

export async function GET(request: NextRequest) {
  const token = process.env.TALLY_API_TOKEN;
  if (!token) {
    return json({ ok: false, error: "TALLY_API_TOKEN not set" }, 500);
  }

  if (!verifyToken(request.headers.get("authorization"), token)) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  const cache = { "Cache-Control": "no-store" };
  const date = request.nextUrl.searchParams.get("date");

  if (date && !DATE_RE.test(date)) {
    return json({ ok: false, error: "Invalid date format. Use YYYY-MM-DD." }, 400);
  }

  try {
    const key = date ? `tally:${date}` : "tally:latest";
    const data = await kv.get(key);

    if (!data) {
      return json({ ok: false, error: "No data yet" }, 404, cache);
    }

    return json(data, 200, cache);
  } catch (err) {
    return handleStorageError(err);
  }
}
