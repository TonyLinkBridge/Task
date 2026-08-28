import { describe, expect, it } from "vitest";

import { makePlatformActions } from "@/features/admin/platform-action-service";
import type { ContentPlatform } from "@/features/content/types";

const activePlatform: ContentPlatform = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Instagram",
  color: "#ec4899",
  archivedAt: null,
  createdAt: "2026-08-28T02:00:00.000Z",
};

function setup(role: "employee" | "admin" = "admin") {
  const calls: string[] = [];
  const actions = makePlatformActions({
    getVerifiedUser: async () => ({
      id: role === "admin" ? "admin-a" : "employee-a",
      role,
      name: role === "admin" ? "上司" : "员工",
      imageUrl: null,
    }),
    create: async (input) => {
      calls.push(`create:${input.name}:${input.color}`);
      return { ...activePlatform, ...input };
    },
    update: async (id, input) => {
      calls.push(`update:${id}:${input.name}:${input.color}`);
      return { ...activePlatform, ...input };
    },
    setArchived: async (id, archived) => {
      calls.push(`${archived ? "archive" : "restore"}:${id}`);
      return {
        ...activePlatform,
        archivedAt: archived ? "2026-08-28T03:00:00.000Z" : null,
      };
    },
    revalidatePath: (path) => calls.push(`revalidate:${path}`),
  });
  return { actions, calls };
}

describe("platform admin actions", () => {
  it("does not let an employee create a platform", async () => {
    const { actions, calls } = setup("employee");

    await expect(
      actions.createPlatform({ name: "TikTok", color: "#000000" })
    ).resolves.toEqual({
      ok: false,
      message: "只有管理员可以管理发布平台。",
    });
    expect(calls).toEqual([]);
  });

  it("trims and creates a custom platform for an admin", async () => {
    const { actions, calls } = setup();

    const result = await actions.createPlatform({
      name: "  LinkedIn  ",
      color: "#2563eb",
    });

    expect(result).toMatchObject({
      ok: true,
      data: { name: "LinkedIn", color: "#2563eb" },
    });
    expect(calls).toEqual([
      "create:LinkedIn:#2563eb",
      "revalidate:/admin/settings",
      "revalidate:/content/new",
      "revalidate:/content",
    ]);
  });

  it("rejects an invalid color before saving", async () => {
    const { actions, calls } = setup();

    await expect(
      actions.createPlatform({ name: "LinkedIn", color: "blue" })
    ).resolves.toEqual({ ok: false, message: "请检查平台名称和颜色。" });
    expect(calls).toEqual([]);
  });

  it("can update, stop, and restore a platform", async () => {
    const { actions, calls } = setup();

    await actions.updatePlatform(activePlatform.id, {
      name: "Instagram Reels",
      color: "#f43f5e",
    });
    await actions.archivePlatform(activePlatform.id);
    await actions.restorePlatform(activePlatform.id);

    expect(calls).toContain(
      `update:${activePlatform.id}:Instagram Reels:#f43f5e`
    );
    expect(calls).toContain(`archive:${activePlatform.id}`);
    expect(calls).toContain(`restore:${activePlatform.id}`);
  });
});
