import { describe, expect, it } from "vitest";
import { OFFER_LABELS, OFFER_PROMPTS, OFFERS } from "./hire";

describe("OFFERS and OFFER_LABELS", () => {
  it("keeps the submitted values the action validates and the subject carries", () => {
    expect(OFFERS).toEqual(["Product engineer", "AI consulting"]);
  });

  it("maps every offer to its visible label", () => {
    expect(Object.keys(OFFER_LABELS).sort()).toEqual([...OFFERS].sort());
    expect(OFFER_LABELS["Product engineer"]).toBe("I need a product engineer");
    expect(OFFER_LABELS["AI consulting"]).toBe(
      "I want to structure and automate my processes with AI",
    );
  });
});

describe("OFFER_PROMPTS", () => {
  it("has a prompt for every offer", () => {
    expect(Object.keys(OFFER_PROMPTS).sort()).toEqual([...OFFERS].sort());
    expect(OFFER_PROMPTS["Product engineer"]).toBe("What are you building?");
    expect(OFFER_PROMPTS["AI consulting"]).toBe("Tell me about your business");
  });
});
