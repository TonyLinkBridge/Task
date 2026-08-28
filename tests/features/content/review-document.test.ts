import { describe, expect, it } from "vitest";

import { documentForReview } from "@/features/content/review-document";

describe("documentForReview", () => {
  it("never falls back to the old snapshot while edited content is unsynchronized", () => {
    expect(
      documentForReview({
        editable: true,
        synchronized: false,
        liveDocument: [{ version: 2 }],
        snapshotDocument: [{ version: 1 }],
      })
    ).toBeNull();
  });

  it("uses the immutable snapshot when content is locked", () => {
    const snapshot = [{ version: 1 }];
    expect(
      documentForReview({
        editable: false,
        synchronized: false,
        liveDocument: null,
        snapshotDocument: snapshot,
      })
    ).toBe(snapshot);
  });
});
