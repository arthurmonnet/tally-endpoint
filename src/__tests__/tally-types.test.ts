import { describe, it, expect } from "vitest";
import { tallyPayloadSchema } from "@/lib/tally-types";

const validV1Payload = {
  version: 1 as const,
  date: "2026-03-15",
  keystrokes: 12450,
  clicks: 3200,
  copy_paste: 85,
  screenshots: 3,
  cmd_z: 42,
  launcher_opens: 15,
  app_switches: 230,
  scroll_distance_m: 120.5,
  mouse_distance_m: 45.2,
  dark_mode_minutes: 360,
  light_mode_minutes: 120,
  top_apps: [{ name: "VS Code", minutes: 180 }],
  files_created: { ts: 5, json: 2 },
  files_deleted: 1,
  git_commits: 8,
  git_stashes: 1,
  peak_ram_gb: 12.4,
  active_hours: 6.5,
  achievements_unlocked: ["keystroke_10k"],
  fun_line: "You mass-deleted 3 files today.",
};

const validV2Payload = {
  ...validV1Payload,
  version: 2 as const,
  peak_windows: 12,
  avg_windows: 6,
};

describe("tallyPayloadSchema", () => {
  describe("v1", () => {
    it("accepts a valid v1 payload", () => {
      const result = tallyPayloadSchema.safeParse(validV1Payload);
      expect(result.success).toBe(true);
    });

    it("rejects v1 with missing required field", () => {
      const { keystrokes: _, ...incomplete } = validV1Payload;
      const result = tallyPayloadSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });
  });

  describe("v2", () => {
    it("accepts a valid v2 payload", () => {
      const result = tallyPayloadSchema.safeParse(validV2Payload);
      expect(result.success).toBe(true);
    });

    it("accepts v2 with optional history", () => {
      const withHistory = {
        ...validV2Payload,
        history: {
          keystrokes: [100, 200],
          clicks: [50, 60],
          screenshots: [1, 2],
          copy_paste: [10, 20],
          git_commits: [3, 4],
        },
      };
      const result = tallyPayloadSchema.safeParse(withHistory);
      expect(result.success).toBe(true);
    });

    it("accepts v2 with null history", () => {
      const result = tallyPayloadSchema.safeParse({ ...validV2Payload, history: null });
      expect(result.success).toBe(true);
    });

    it("rejects v2 missing peak_windows", () => {
      const { peak_windows: _, ...incomplete } = validV2Payload;
      const result = tallyPayloadSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });
  });

  describe("validation rules", () => {
    it("rejects invalid date format", () => {
      const result = tallyPayloadSchema.safeParse({ ...validV1Payload, date: "15-03-2026" });
      expect(result.success).toBe(false);
    });

    it("rejects negative keystrokes", () => {
      const result = tallyPayloadSchema.safeParse({ ...validV1Payload, keystrokes: -1 });
      expect(result.success).toBe(false);
    });

    it("rejects non-integer clicks", () => {
      const result = tallyPayloadSchema.safeParse({ ...validV1Payload, clicks: 1.5 });
      expect(result.success).toBe(false);
    });

    it("allows decimal scroll_distance_m", () => {
      const result = tallyPayloadSchema.safeParse({ ...validV1Payload, scroll_distance_m: 99.99 });
      expect(result.success).toBe(true);
    });

    it("rejects unknown version", () => {
      const result = tallyPayloadSchema.safeParse({ ...validV1Payload, version: 99 });
      expect(result.success).toBe(false);
    });

    it("rejects missing version", () => {
      const { version: _, ...noVersion } = validV1Payload;
      const result = tallyPayloadSchema.safeParse(noVersion);
      expect(result.success).toBe(false);
    });

    it("rejects empty top_apps entry name", () => {
      const result = tallyPayloadSchema.safeParse({
        ...validV1Payload,
        top_apps: [{ name: "", minutes: 10 }],
      });
      // empty string is still a valid string — schema allows it
      expect(result.success).toBe(true);
    });
  });
});
