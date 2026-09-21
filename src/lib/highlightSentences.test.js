import { describe, expect, it } from "vitest";
import {
  buildHighlightedParts,
  buildHighlightedPartsFromExcerpts,
  expandToSentenceBounds,
  expandToWordBounds,
  mergeEvidenceTexts,
} from "./highlightSentences";

describe("expandToWordBounds", () => {
  it("does not start mid-word (erson → person)", () => {
    const text = "Now if a poor person of domestic use.";
    const mid = text.indexOf("erson");
    const bounds = expandToWordBounds(text, mid, mid + 5);
    expect(text.slice(bounds.start, bounds.end)).toBe("person");
  });
});

describe("expandToSentenceBounds", () => {
  it("expands a mid-sentence match to the full sentence", () => {
    const text =
      "Intro clause here. Taking example of section 54-C of the Act is applied. Next sentence.";
    const start = text.indexOf("section 54-C");
    const end = start + "section 54-C".length;
    const bounds = expandToSentenceBounds(text, start, end);
    expect(text.slice(bounds.start, bounds.end)).toBe(
      "Taking example of section 54-C of the Act is applied."
    );
  });

  it("does not start mid-word after expansion", () => {
    const text = "Lead-in. Now if a poor person of domestic use is charged.";
    const mid = text.indexOf("erson");
    const bounds = expandToSentenceBounds(text, mid, mid + 5);
    expect(text.slice(bounds.start, bounds.end)).toBe(
      "Now if a poor person of domestic use is charged."
    );
    expect(bounds.start === 0 || !/[A-Za-z0-9]/.test(text[bounds.start - 1])).toBe(
      true
    );
  });

  it("does not treat v. as a sentence end", () => {
    const text = "See Smith v. Jones on appeal. Next.";
    const start = text.indexOf("Jones");
    const bounds = expandToSentenceBounds(text, start, start + 5);
    expect(text.slice(bounds.start, bounds.end)).toBe(
      "See Smith v. Jones on appeal."
    );
  });
});

describe("buildHighlightedParts", () => {
  it("highlights the full sentence and rejects mid-word excerpt matches", () => {
    const text =
      "Lead-in. Taking example of section 54-C of Electricity Act, 1910 is applied. Tail.";
    const parts = buildHighlightedParts(
      text,
      null,
      null,
      "section 54-C of Electricity Act"
    );
    expect(parts.highlight).toBe(
      "Taking example of section 54-C of Electricity Act, 1910 is applied."
    );
  });

  it("snaps mid-word excerpts like erson → full sentence with person", () => {
    const text = "Lead-in. Now if a poor person of domestic use is charged. Tail.";
    const parts = buildHighlightedParts(text, null, null, "erson of domestic use is charged");
    expect(parts.highlight).toBe(
      "Now if a poor person of domestic use is charged."
    );
    expect(parts.highlight.startsWith("erson")).toBe(false);
    expect(parts.highlight).toContain("person");
  });

  it("matches excerpts even when newlines differ from full text", () => {
    const text =
      "Lead-in. Now if a poor person of domestic consumption up to a one kilowatt is charged. Tail.";
    const excerpt =
      "Now if a poor person of domestic\nconsumption up to a one kilowatt is charged";
    const parts = buildHighlightedParts(text, null, null, excerpt);
    expect(parts.highlight).toContain("poor person of domestic consumption");
  });
});

describe("mergeEvidenceTexts", () => {
  it("combines overlapping passages into one text", () => {
    const merged = mergeEvidenceTexts([
      {
        excerpt:
          "Now if a poor person of domestic consumption up to a one kilowatt is sent with a bill",
      },
      {
        excerpt:
          "erson of domestic consumption up to a one kilowatt is sent with a bill of unreasonable amount",
      },
    ]);
    expect(merged.toLowerCase()).toContain("poor person of domestic");
    expect(merged.toLowerCase()).toContain("unreasonable amount");
    expect(merged.match(/one kilowatt/gi)?.length).toBe(1);
  });
});

describe("buildHighlightedPartsFromExcerpts", () => {
  it("highlights the span covering both passages", () => {
    const text =
      "Intro. Alpha sentence about section 54-C of the Act is here. Beta sentence continues the clog on discretion clearly. Tail.";
    const parts = buildHighlightedPartsFromExcerpts(text, [
      { excerpt: "section 54-C of the Act" },
      { excerpt: "clog on discretion" },
    ]);
    expect(parts.highlight).toContain("section 54-C");
    expect(parts.highlight).toContain("clog on discretion");
  });
});
