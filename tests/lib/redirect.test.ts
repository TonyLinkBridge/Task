import { describe, expect, it } from "vitest";

import { buildLoginUrl, safeRedirectPath } from "@/lib/auth/redirect";

describe("safeRedirectPath", () => {
  it("keeps a local path with its query", () => {
    expect(safeRedirectPath("/content/item-1?view=review")).toBe(
      "/marketing/content/item-1?view=review"
    );
  });

  it.each([undefined, "", "https://evil.example", "//evil.example/path"])(
    "falls back to Overview for %s",
    (value) => {
      expect(safeRedirectPath(value)).toBe("/marketing");
    }
  );
  it.each([
    ['/', '/marketing'], ['/dashboard', '/marketing'],
    ['/tasks?assignee=ivy&search=hello', '/marketing/tasks?assignee=ivy&search=hello'],
    ['/content/new', '/marketing/content/new'],
    ['/content?platform=x&view=board', '/marketing/calendar?platform=x&view=board'],
    ['/admin/settings', '/marketing/settings/notifications'],
    ['/admin/history', '/marketing/history'],
    ['/tasks/task-123?tab=comments', '/tasks/task-123?tab=comments'],
    ['/help/内容排期/审核', '/help/内容排期/审核'],
    ['/marketing/calendar?date=2026-10-25', '/marketing/calendar?date=2026-10-25'],
    ['/login', '/marketing'], ['/sso-callback', '/marketing'],
  ])('maps %s without losing the intended destination', (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

});

describe("buildLoginUrl", () => {
  it("keeps the protected path so login can return the user there", () => {
    expect(
      buildLoginUrl("https://internal.example/content?status=review").toString()
    ).toBe(
      "https://internal.example/login?redirect=%2Fmarketing%2Fcalendar%3Fview%3Dlist%26status%3Dreview"
    );
  });
});
