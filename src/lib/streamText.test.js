import { describe, expect, it } from "vitest";

import { appendStreamChunk, withHardBreaks } from "./streamText";

describe("appendStreamChunk", () => {
  it("inserts a space when two word tokens would otherwise glue", () => {
    expect(appendStreamChunk("Section", "54-c")).toBe("Section 54-c");
  });

  it("does not duplicate a space the model already sent", () => {
    expect(appendStreamChunk("Section", " 54-c")).toBe("Section 54-c");
  });

  it("does not insert a space before punctuation", () => {
    expect(appendStreamChunk("held", ".")).toBe("held.");
  });
});

describe("withHardBreaks", () => {
  it("turns single newlines into markdown hard breaks", () => {
    expect(withHardBreaks("a\nb")).toBe("a  \nb");
  });
});
