import { describe, expect, it } from "vitest";
import { reflowDocumentText } from "./reflowDocumentText";

describe("reflowDocumentText", () => {
  it("joins hard-wrapped body lines into a full-width paragraph", () => {
    const raw = [
      "Taking example of section 54‑C",
      "of Electricity Act, 1910, an Act got much familiarity in the present reign, is",
      "in discriminate application.",
    ].join("\n");

    expect(reflowDocumentText(raw)).toBe(
      "Taking example of section 54‑C of Electricity Act, 1910, an Act got much familiarity in the present reign, is in discriminate application."
    );
  });

  it("keeps headings on single newlines (does not add extra blank lines)", () => {
    const raw = [
      "CLOG ON DISCRETION",
      "By",
      "M. Qasim Khan Khattak, Advocate,",
      "Karak, (N.‑W.F.P.)",
      "",
      "Taking example of section 54‑C",
      "of Electricity Act, 1910, an Act got much familiarity in the present reign, is",
      "in discriminate application.",
    ].join("\n");

    expect(reflowDocumentText(raw)).toBe(
      [
        "CLOG ON DISCRETION",
        "By",
        "M. Qasim Khan Khattak, Advocate,",
        "Karak, (N.‑W.F.P.)",
        "",
        "Taking example of section 54‑C of Electricity Act, 1910, an Act got much familiarity in the present reign, is in discriminate application.",
      ].join("\n")
    );
  });

  it("keeps blank-line paragraph breaks from the source", () => {
    const raw = "Opening title\n\nFirst para line\ncontinued here.\n\nSecond para.";
    expect(reflowDocumentText(raw)).toBe(
      "Opening title\n\nFirst para line continued here.\n\nSecond para."
    );
  });
});
