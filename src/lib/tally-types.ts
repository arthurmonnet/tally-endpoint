import { z } from "zod";

const appTimeEntrySchema = z.object({
  name: z.string(),
  minutes: z.number(),
});

const historySchema = z.object({
  keystrokes: z.array(z.number()),
  clicks: z.array(z.number()),
  screenshots: z.array(z.number()),
  copy_paste: z.array(z.number()),
  git_commits: z.array(z.number()),
});

const baseFields = {
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  keystrokes: z.number().int().nonnegative(),
  clicks: z.number().int().nonnegative(),
  copy_paste: z.number().int().nonnegative(),
  screenshots: z.number().int().nonnegative(),
  cmd_z: z.number().int().nonnegative(),
  launcher_opens: z.number().int().nonnegative(),
  app_switches: z.number().int().nonnegative(),
  scroll_distance_m: z.number().nonnegative(),
  mouse_distance_m: z.number().nonnegative(),
  dark_mode_minutes: z.number().int().nonnegative(),
  light_mode_minutes: z.number().int().nonnegative(),
  top_apps: z.array(appTimeEntrySchema),
  files_created: z.record(z.string(), z.number().int().nonnegative()),
  files_deleted: z.number().int().nonnegative(),
  git_commits: z.number().int().nonnegative(),
  git_stashes: z.number().int().nonnegative(),
  peak_ram_gb: z.number().nonnegative(),
  active_hours: z.number().nonnegative(),
  achievements_unlocked: z.array(z.string()),
  fun_line: z.string(),
};

const v1Schema = z.object({
  version: z.literal(1),
  ...baseFields,
});

const v2Schema = z.object({
  version: z.literal(2),
  ...baseFields,
  peak_windows: z.number().int().nonnegative(),
  avg_windows: z.number().int().nonnegative(),
  history: historySchema.optional().nullable(),
});

export const tallyPayloadSchema = z.discriminatedUnion("version", [
  v1Schema,
  v2Schema,
]);

export type TallyPayload = z.infer<typeof tallyPayloadSchema>;
export type TallyPayloadV2 = z.infer<typeof v2Schema>;
