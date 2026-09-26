import { z } from "zod";
import { guidedInterviewSchema } from "./guided-interview";
import { GUIDED_INTERVIEW_STEPS } from "./guided-interview";
import { templateOptions } from "./template-contracts";

export const exactFieldSchema = z.enum(["name", "role", "intro", "skills", "education", "website", "projectTitle", "projectSummary"]);
export type ExactField = z.infer<typeof exactFieldSchema>;
export const exactLabels: Record<ExactField, string> = {
  name: "Your name", role: "Professional role", intro: "Introduction", skills: "Skills",
  education: "Education", website: "Website URL", projectTitle: "First project title", projectSummary: "First project summary",
};
const limits: Record<ExactField, number> = { name: 60, role: 80, intro: 220, skills: 300, education: 600, website: 300, projectTitle: 100, projectSummary: 500 };

export const voiceOnboardingSchema = z.object({
  confirmed: z.partialRecord(exactFieldSchema, z.string()).default({}),
  direction: guidedInterviewSchema.partial().default({}),
  selectedTemplate: z.enum(templateOptions).optional(),
  projectSkipped: z.boolean().optional(),
  pending: z.object({ field: exactFieldSchema, value: z.string(), id: z.string().uuid() }).nullable().default(null),
});
export type VoiceOnboarding = z.infer<typeof voiceOnboardingSchema>;
export const emptyVoiceOnboarding = (): VoiceOnboarding => ({ confirmed: {}, direction: {}, pending: null });

export function proposeExact(state: VoiceOnboarding, field: ExactField, raw: string): VoiceOnboarding {
  const value = raw.trim().replace(/\s+/g, " ");
  if (!value || value.length > limits[field]) throw new Error(`${exactLabels[field]} must be between 1 and ${limits[field]} characters.`);
  if (field === "website" && !/^https?:\/\/[^\s]+$/i.test(value)) throw new Error("Please provide a complete website URL beginning with https://.");
  return { ...state, pending: { field, value, id: crypto.randomUUID() } };
}

export function confirmExact(state: VoiceOnboarding, id: string): VoiceOnboarding {
  if (!state.pending || state.pending.id !== id) throw new Error("That answer changed. Please review the latest wording before confirming.");
  const { field, value } = state.pending;
  return { ...state, confirmed: { ...state.confirmed, [field]: value }, pending: null };
}

export function isVoiceDraftReady(state: VoiceOnboarding) {
  return Boolean(state.confirmed.name?.trim() && state.confirmed.role?.trim() && state.confirmed.intro?.trim() &&
    guidedInterviewSchema.safeParse(state.direction).success && state.selectedTemplate && !state.pending);
}

/** The next question is computed from saved facts, including the template choice. */
export function nextVoiceInterviewStep(state: VoiceOnboarding): string {
  if (state.pending) return `Confirm the exact ${exactLabels[state.pending.field]}: ${state.pending.value}.`;
  for (const field of ["name", "role", "intro"] as const) if (!state.confirmed[field]?.trim()) return `Ask for ${exactLabels[field].toLowerCase()}.`;
  for (const step of GUIDED_INTERVIEW_STEPS) if (!state.direction[step.key]) return step.prompt;
  if (!state.selectedTemplate) return "Show the template previews and ask the user to choose one.";
  return "The template is already selected. Mention optional education, skills, website and first project briefly, then invite the user to create the private draft. Do not ask for the template again.";
}
