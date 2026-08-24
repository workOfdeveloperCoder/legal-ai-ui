import { describe, expect, it } from "vitest";
import {
  idsForDocumentGet,
  isUuid,
  normalizeSourceType,
  resolveDocumentGetPath,
} from "./documentFetch";

const DOC = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const CONV = "11111111-2222-3333-4444-555555555555";
const MATTER = "99999999-8888-7777-6666-555555555555";

describe("resolveDocumentGetPath", () => {
  it("uses the conversation document GET", () => {
    expect(
      resolveDocumentGetPath({
        documentId: DOC,
        conversationId: CONV,
        sourceType: "conversation",
      })
    ).toBe(`/documents/conversations/${CONV}/document/${DOC}`);
  });

  it("uses the matter document GET", () => {
    expect(
      resolveDocumentGetPath({
        documentId: DOC,
        matterId: MATTER,
        sourceType: "matter",
      })
    ).toBe(`/matters/${MATTER}/document/${DOC}`);
  });

  it("does not fetch library or legal corpus files", () => {
    expect(
      resolveDocumentGetPath({
        documentId: DOC,
        conversationId: CONV,
        sourceType: "library",
      })
    ).toBeNull();
    expect(
      resolveDocumentGetPath({
        documentId: DOC,
        conversationId: CONV,
        sourceType: "legal",
      })
    ).toBeNull();
  });

  it("does not use a draft conversation id", () => {
    expect(
      resolveDocumentGetPath({
        documentId: DOC,
        conversationId: `draft-${CONV}`,
        sourceType: "conversation",
      })
    ).toBeNull();
  });

  it("does not fetch when document_id is not a UUID", () => {
    expect(
      resolveDocumentGetPath({
        documentId: "2000J8.txt",
        conversationId: CONV,
        sourceType: "conversation",
      })
    ).toBeNull();
  });
});

describe("idsForDocumentGet", () => {
  it("does not borrow the open chat id for library cards", () => {
    const ids = idsForDocumentGet({
      source: {
        documentId: DOC,
        sourceType: "legal",
      },
      conversationId: CONV,
      matterId: MATTER,
    });
    expect(ids.conversationId).toBeNull();
    expect(ids.matterId).toBeNull();
    expect(resolveDocumentGetPath(ids)).toBeNull();
  });

  it("falls back to the open chat only for conversation-scoped cards", () => {
    const ids = idsForDocumentGet({
      source: {
        documentId: DOC,
        sourceType: "conversation",
      },
      conversationId: CONV,
    });
    expect(ids.conversationId).toBe(CONV);
    expect(resolveDocumentGetPath(ids)).toBe(
      `/documents/conversations/${CONV}/document/${DOC}`
    );
  });

  it("prefers the resource's own conversation id", () => {
    const ids = idsForDocumentGet({
      source: {
        documentId: DOC,
        sourceType: "conversation",
        conversationId: CONV,
      },
      conversationId: MATTER,
    });
    expect(ids.conversationId).toBe(CONV);
  });
});

describe("normalizeSourceType", () => {
  it("maps legal corpus files to library", () => {
    expect(normalizeSourceType("legal")).toBe("library");
    expect(normalizeSourceType("conversation")).toBe("conversation");
  });

  it("accepts UUID strings", () => {
    expect(isUuid(DOC)).toBe(true);
    expect(isUuid("draft-1")).toBe(false);
  });
});
