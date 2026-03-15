import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSet = vi.fn();
const mockGet = vi.fn();

vi.mock("@vercel/kv", () => ({
  kv: {
    set: (...args: unknown[]) => mockSet(...args),
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

import { POST, GET, OPTIONS } from "@/app/api/tally/route";
import { NextRequest } from "next/server";

const VALID_TOKEN = "test-secret-token";

const validPayload = {
  version: 1,
  date: "2026-03-15",
  keystrokes: 100,
  clicks: 50,
  copy_paste: 10,
  screenshots: 1,
  cmd_z: 5,
  launcher_opens: 2,
  app_switches: 20,
  scroll_distance_m: 10.5,
  mouse_distance_m: 5.2,
  dark_mode_minutes: 60,
  light_mode_minutes: 30,
  top_apps: [{ name: "Terminal", minutes: 45 }],
  files_created: { ts: 1 },
  files_deleted: 0,
  git_commits: 3,
  git_stashes: 0,
  peak_ram_gb: 8.0,
  active_hours: 2.5,
  achievements_unlocked: [],
  fun_line: "Hello world",
};

function makeRequest(
  method: string,
  opts: { token?: string; body?: unknown; searchParams?: Record<string, string> } = {},
): NextRequest {
  const url = new URL("http://localhost:3000/api/tally");
  if (opts.searchParams) {
    for (const [k, v] of Object.entries(opts.searchParams)) {
      url.searchParams.set(k, v);
    }
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) {
    headers["Authorization"] = `Bearer ${opts.token}`;
  }

  return new NextRequest(url, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

describe("OPTIONS", () => {
  it("returns 204 with CORS headers", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });
});

describe("POST /api/tally", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("TALLY_API_TOKEN", VALID_TOKEN);
  });

  it("returns 500 when TALLY_API_TOKEN is not set", async () => {
    vi.stubEnv("TALLY_API_TOKEN", "");
    delete process.env.TALLY_API_TOKEN;

    const req = makeRequest("POST", { token: "anything", body: validPayload });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain("TALLY_API_TOKEN");
  });

  it("returns 401 without auth header", async () => {
    const req = makeRequest("POST", { body: validPayload });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong token", async () => {
    const req = makeRequest("POST", { token: "wrong-token", body: validPayload });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid JSON", async () => {
    const url = new URL("http://localhost:3000/api/tally");
    const req = new NextRequest(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VALID_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: "not json{{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 422 for invalid schema", async () => {
    const req = makeRequest("POST", {
      token: VALID_TOKEN,
      body: { version: 1, date: "bad-date" },
    });
    const res = await POST(req);
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toBe("Validation failed");
  });

  it("stores valid payload and returns 200", async () => {
    mockSet.mockResolvedValue("OK");

    const req = makeRequest("POST", { token: VALID_TOKEN, body: validPayload });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);

    expect(mockSet).toHaveBeenCalledWith("tally:2026-03-15", validPayload);
    expect(mockSet).toHaveBeenCalledWith("tally:latest", validPayload);
  });

  it("returns 500 on KV error without leaking details", async () => {
    mockSet.mockRejectedValue(new Error("UPSTASH connection refused at redis://secret:6379"));

    const req = makeRequest("POST", { token: VALID_TOKEN, body: validPayload });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("KV store not connected.");
    expect(data.error).not.toContain("redis://");
  });

  it("returns generic error for non-KV errors", async () => {
    mockSet.mockRejectedValue(new Error("Something unexpected"));

    const req = makeRequest("POST", { token: VALID_TOKEN, body: validPayload });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Storage error.");
    expect(data.error).not.toContain("unexpected");
  });
});

describe("GET /api/tally", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("TALLY_API_TOKEN", VALID_TOKEN);
  });

  it("returns 401 without auth header", async () => {
    const req = makeRequest("GET");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong token", async () => {
    const req = makeRequest("GET", { token: "wrong" });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns latest data when no date param", async () => {
    mockGet.mockResolvedValue(validPayload);

    const req = makeRequest("GET", { token: VALID_TOKEN });
    const res = await GET(req);
    expect(res.status).toBe(200);

    expect(mockGet).toHaveBeenCalledWith("tally:latest");
    const data = await res.json();
    expect(data.keystrokes).toBe(100);
  });

  it("returns data for specific date", async () => {
    mockGet.mockResolvedValue(validPayload);

    const req = makeRequest("GET", {
      token: VALID_TOKEN,
      searchParams: { date: "2026-03-15" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mockGet).toHaveBeenCalledWith("tally:2026-03-15");
  });

  it("returns 400 for invalid date format", async () => {
    const req = makeRequest("GET", {
      token: VALID_TOKEN,
      searchParams: { date: "15/03/2026" },
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("YYYY-MM-DD");
  });

  it("returns 404 when no data exists", async () => {
    mockGet.mockResolvedValue(null);

    const req = makeRequest("GET", { token: VALID_TOKEN });
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it("returns 500 on KV error without leaking details", async () => {
    mockGet.mockRejectedValue(new Error("KV timeout at redis://internal:6379"));

    const req = makeRequest("GET", { token: VALID_TOKEN });
    const res = await GET(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("KV store not connected.");
  });

  it("includes cache headers", async () => {
    mockGet.mockResolvedValue(validPayload);

    const req = makeRequest("GET", { token: VALID_TOKEN });
    const res = await GET(req);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage");
  });
});
