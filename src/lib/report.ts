import { z } from "zod";

export const REPORT_REASONS = ["impersonation", "real_contact", "personal_data", "missing_warning", "broken", "other"] as const;

export const reportInput = z.object({
  workSlug: z.string().min(1).max(100),
  reason: z.enum(REPORT_REASONS),
  details: z.string().max(1000).default(""),
});
