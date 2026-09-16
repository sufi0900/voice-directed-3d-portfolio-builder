import { describe, expect, it } from "vitest";
import { applyGuidedInterview, guidedInterviewSchema } from "./guided-interview";
import { DEFAULT_SITE_DOCUMENT, validateSiteDocument } from "./site-document";

describe("CV-grounded guided interview", () => {
  it("rejects incomplete interview answers", () => {
    expect(guidedInterviewSchema.safeParse({ goal: "win-clients" }).success).toBe(false);
  });

  it("maps a complete direction into governed design settings", () => {
    const result = applyGuidedInterview(DEFAULT_SITE_DOCUMENT, {
      goal: "find-role", audience: "employers", tone: "structured", motion: "reduced", emphasis: "skills",
    });
    expect(result.identity.availability).toContain("professional opportunities");
    expect(result.design).toEqual({ accent: "violet", background: "ink", heroAlignment: "left" });
    expect(result.scene.motion).toBe("still");
    expect(result.scene.focusedSkill).toBe("web");
    expect(validateSiteDocument(result).guidedInterview?.audience).toBe("employers");
  });

  it("does not rewrite identity claims supplied by the user or approved CV", () => {
    const result = applyGuidedInterview(DEFAULT_SITE_DOCUMENT, {
      goal: "win-clients", audience: "clients", tone: "bold", motion: "immersive", emphasis: "results",
    });
    expect(result.identity.name).toBe(DEFAULT_SITE_DOCUMENT.identity.name);
    expect(result.identity.role).toBe(DEFAULT_SITE_DOCUMENT.identity.role);
    expect(result.identity.intro).toBe(DEFAULT_SITE_DOCUMENT.identity.intro);
  });
});
