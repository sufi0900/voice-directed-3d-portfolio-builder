import { describe, expect, it } from "vitest";
import { feedbackError, opportunityFeedbackSchema } from "./opportunity-feedback";

describe("opportunity feedback", () => {
  it("accepts bounded recipient feedback", () => {
    expect(opportunityFeedbackSchema.parse({ rating: 5, message: "A clear and relevant portfolio.", contact: "reviewer@example.com" })).toMatchObject({ rating: 5 });
  });

  it("rejects invalid ratings and empty messages", () => {
    expect(feedbackError({ rating: 6, message: "Useful" })).toBeTruthy();
    expect(feedbackError({ rating: 3, message: "" })).toBeTruthy();
  });

  it("does not accept unknown fields", () => {
    expect(feedbackError({ rating: 4, message: "Useful feedback", ownerId: "secret" })).toBeTruthy();
  });
});
