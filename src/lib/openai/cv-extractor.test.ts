import { describe, expect, it } from "vitest";
import { isGrounded, mergeCvCandidates, parseStructuredResponseText, readResponseText, responseIncompleteReason } from "./cv-extractor";
import type { CvCandidate } from "@/domain/cv-ingestion";

const fact = (kind: CvCandidate["kind"], value: string): CvCandidate => ({ id: `${kind}-${value}`, kind, value, sourceExcerpt: value, confidence: "high" });

describe("AI CV extraction recovery", () => {
  it("reads text from raw Responses API message output", () => {
    expect(readResponseText({ output: [{ content: [{ type: "output_text", text: "{\"facts\":[]}" }] }] })).toBe("{\"facts\":[]}");
  });

  it("reports an incomplete Responses API result before attempting JSON parsing", () => {
    expect(responseIncompleteReason({ status: "incomplete", incomplete_details: { reason: "max_output_tokens" } })).toBe("max_output_tokens");
    expect(responseIncompleteReason({ status: "completed" })).toBeNull();
  });

  it("accepts valid structured JSON even when a provider wraps it in a markdown fence", () => {
    expect(parseStructuredResponseText('```json\n{"facts":[],"warnings":[]}\n```')).toEqual({ facts: [], warnings: [] });
  });

  it("rejects source excerpts that are not grounded in extracted CV text", () => {
    expect(isGrounded("Sufian Mustafa SEO Specialist", "Sufian Mustafa is an SEO Specialist and writer")).toBe(true);
    expect(isGrounded("Chief Financial Officer London", "Sufian Mustafa is an SEO Specialist and writer")).toBe(false);
  });

  it("prefers AI identity fields while retaining missing local recovery facts", () => {
    const merged = mergeCvCandidates([fact("name", "Sufian Mustafa")], [fact("name", "Education"), fact("role", "SEO Specialist")]);
    expect(merged.filter((item) => item.kind === "name").map((item) => item.value)).toEqual(["Sufian Mustafa"]);
    expect(merged.find((item) => item.kind === "role")?.value).toBe("SEO Specialist");
  });
});
