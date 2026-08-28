import { describe, expect, it } from "vitest";

import { buildLoginUrl, safeRedirectPath } from "@/lib/auth/redirect";

describe("safeRedirectPath", () => {
  it("keeps a local path with its query", () => {
    expect(safeRedirectPath("/content/item-1?view=review")).toBe(
      "/content/item-1?view=review"
    );
  });

  it.each([undefined, "", "https://evil.example", "//evil.example/path"])(
    "falls back to tasks for %s",
    (value) => {
      expect(safeRedirectPath(value)).toBe("/tasks");
    }
  );
});

describe("buildLoginUrl", () => {
  it("keeps the protected path so login can return the user there", () => {
    expect(
      buildLoginUrl("https://internal.example/content?status=review").toString()
    ).toBe(
      "https://internal.example/login?redirect=%2Fcontent%3Fstatus%3Dreview"
    );
  });
});
