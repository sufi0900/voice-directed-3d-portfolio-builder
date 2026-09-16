import { z } from "zod";

export const publicationSlugSchema = z.string().trim().toLowerCase().min(3).max(64).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const publishRequestSchema = z.object({ slug: publicationSlugSchema, expectedRevision: z.number().int().nonnegative() });

export function normalizePublicationSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64).replace(/-+$/g, "");
}
