import { describe, expect, it } from "vitest";

import { roomPermissions } from "@/features/content/room-permissions";

describe("roomPermissions", () => {
  it("locks the document but keeps review comments open", () => {
    expect(roomPermissions(false)).toEqual(["*:read", "comments:write"]);
  });

  it("allows full editing for drafts and requested changes", () => {
    expect(roomPermissions(true)).toEqual(["*:write"]);
  });
});
