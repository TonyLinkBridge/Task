import { describe, expect, it } from "vitest";

import {
  approvalProgress,
  canEditBody,
  canPublish,
  requiredApprovals,
} from "@/features/approval/rules";

describe("content approval rules", () => {
  it("requires two distinct admins for employee content", () => {
    expect(requiredApprovals("employee")).toBe(2);
    expect(approvalProgress(2, ["boss-a", "boss-a"])).toEqual({
      count: 1,
      complete: false,
    });
    expect(approvalProgress(2, ["boss-a", "boss-b"])).toEqual({
      count: 2,
      complete: true,
    });
  });

  it("requires one approval for admin content", () => {
    expect(requiredApprovals("admin")).toBe(1);
  });

  it.each(["draft", "changes_requested"] as const)(
    "lets people edit the body while content is %s",
    (status) => {
      expect(canEditBody(status)).toBe(true);
    }
  );

  it.each([
    "in_review",
    "approved",
    "due",
    "published",
    "archived",
  ] as const)("locks the body while content is %s", (status) => {
    expect(canEditBody(status)).toBe(false);
  });

  it.each(["approved", "due"] as const)(
    "allows publishing content that is %s",
    (status) => {
      expect(canPublish(status)).toBe(true);
    }
  );

  it.each([
    "draft",
    "in_review",
    "changes_requested",
    "published",
    "archived",
  ] as const)("does not allow publishing content that is %s", (status) => {
    expect(canPublish(status)).toBe(false);
  });
});
