import { describe, expect, it } from "vitest";
import { executeAssistantSteps } from "./assistant-steps";

describe("multi-step assistant execution", () => {
  it("stops after the first rejected step and reports earlier successful edits", async () => {
    const visited: string[] = [];
    const result = await executeAssistantSteps(["first", "invalid", "third"].map((name) => ({ name, arguments: {} })), async (call) => {
      visited.push(call.name);
      return call.name === "invalid" ? { ok: false, error: "Evidence missing" } : { ok: true, message: "Saved" };
    });
    expect(visited).toEqual(["first", "invalid"]);
    expect(result.completed).toHaveLength(1);
    expect(result.error).toBe("Evidence missing");
  });
  it("rejects an oversized plan before applying any action", async () => {
    const visited: string[] = [];
    const result = await executeAssistantSteps(Array.from({ length: 13 }, (_, index) => ({ name: String(index), arguments: {} })), async call => {
      visited.push(call.name);
      return { ok: true, message: "done" };
    });
    expect(visited).toEqual([]);
    expect(result.error).toContain("more than 12");
  });
});
