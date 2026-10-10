import { describe, expect, it } from "vitest";
import { OFFER_LABELS, OFFERS } from "./hire";

describe("OFFERS and OFFER_LABELS", () => {
  it("keeps the submitted values the action validates and the subject carries", () => {
    expect(OFFERS).toEqual(["Product engineer", "AI consulting"]);
  });

  it("maps every offer to its visible label", () => {
    expect(Object.keys(OFFER_LABELS).sort()).toEqual([...OFFERS].sort());
    expect(OFFER_LABELS["Product engineer"]).toBe(
      "I need a product engineer (contract or full-time)",
    );
    expect(OFFER_LABELS["AI consulting"]).toBe("I want to take work off my own plate");
  });
});
