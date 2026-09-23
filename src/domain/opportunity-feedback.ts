import { z } from "zod";

export const opportunityFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(3).max(2000),
  contact: z.string().trim().max(160).default(""),
}).strict();

export type OpportunityFeedback = z.infer<typeof opportunityFeedbackSchema>;

export function feedbackError(input: unknown) {
  const result = opportunityFeedbackSchema.safeParse(input);
  return result.success ? null : (result.error.issues[0]?.message ?? "Please provide valid feedback.");
}
