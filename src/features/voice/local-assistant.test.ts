import { describe, expect, it } from "vitest";
import { planLocalAssistant } from "./local-assistant";

describe("local assistant planner", () => {
  it("routes navigation without an AI provider", () => {
    expect(planLocalAssistant("move to blog section")).toMatchObject({
      source: "local",
      calls: [{ name: "navigate_to", arguments: { destination: "blog" } }],
    });
    expect(planLocalAssistant("jump to the About section")).toMatchObject({
      calls: [{ name: "navigate_to", arguments: { destination: "about" } }],
    });
  });

  it("routes exact text edits locally but leaves generative work to AI", () => {
    expect(planLocalAssistant("change my about heading to My journey")).toMatchObject({
      calls: [{ name: "update_text_content", arguments: { target: "about_heading", text: "My journey", polish: false } }],
    });
    expect(planLocalAssistant("improve my About section")).toBeNull();
  });

  it("supports undo, skills, and complete social URLs locally", () => {
    expect(planLocalAssistant("undo that")?.calls[0].name).toBe("undo_last_change");
    expect(planLocalAssistant("add Accessibility as a skill")?.calls[0]).toMatchObject({ name: "manage_skill", arguments: { label: "Accessibility" } });
    expect(planLocalAssistant("add https://tiktok.com/@sufian as my TikTok profile")?.calls[0]).toMatchObject({ name: "manage_social_link", arguments: { platform: "tiktok" } });
  });
});
