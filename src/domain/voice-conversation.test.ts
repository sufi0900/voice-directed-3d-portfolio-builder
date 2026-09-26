import { describe, expect, it } from "vitest";
import { appendSpokenWord, isAffirmative, isDraftCreationIntent } from "./voice-conversation";

describe("voice interview confirmation and captions", () => {
  it("understands common affirmations without interpreting corrections as consent", () => {
    for (const text of ["Yes.", "Yes, yes, proceed with next", "Yes, this is correct", "okay", "this is okay", "proceed to the next step", "go ahead", "exactly", "sounds right"]) expect(isAffirmative(text)).toBe(true);
    for (const text of ["yes but the spelling is wrong", "no", "okay change the name", "proceed but change the title", "I guess so"]) expect(isAffirmative(text)).toBe(false);
  });
  it("preserves spaces and punctuation between streaming speech words", () => {
    expect(["Hello", "there", ",", "welcome", "back", "."].reduce(appendSpokenWord, "")).toBe("Hello there, welcome back.");
  });
  it("accepts final save commands without interpreting questions or cancellation as consent", () => {
    for (const text of ["Publish Now", "Create my private draft", "Please save the draft", "Proceed to the final step", "Finalize my portfolio"]) expect(isDraftCreationIntent(text)).toBe(true);
    for (const text of ["Don't publish now", "How do I create a draft?", "Can I publish now?", "Wait, save it later"]) expect(isDraftCreationIntent(text)).toBe(false);
  });
});
