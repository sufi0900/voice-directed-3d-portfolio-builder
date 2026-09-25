import { describe, expect, it } from "vitest";
import { documentEvidence, extractVisitorText } from "./visitor-document";

describe("persistent Visitor Vox document retrieval", () => {
  it("can find material near the end of a long uploaded document without truncating it", () => {
    const text = `${"Earlier material with unrelated details.\n\n".repeat(110)}A difficult technical SEO crawl is handled by checking canonical tags, robots rules, and server logs.`;
    const matches = documentEvidence([{ id: "stored", file_name: "approach.txt", body: text }], "How do you check canonical tags and server logs?");
    expect(matches[0]?.id).toMatch(/^document:stored:/);
    expect(matches[0]?.text).toContain("server logs");
  });
  it("rejects oversized extracted text instead of silently dropping unindexed content", async () => {
    const file = new File(["a".repeat(200_001)], "notes.txt", { type: "text/plain" });
    await expect(extractVisitorText(file)).rejects.toThrow("Divide it into smaller complete documents");
  });
});
