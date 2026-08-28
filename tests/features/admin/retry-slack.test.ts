import { describe, expect, it } from "vitest";

import { makeRetrySlackDelivery } from "@/features/admin/retry-slack-service";

function setup(status: "failed" | "sent" = "failed", role: "admin" | "employee" = "admin") {
  const calls: string[] = [];
  const action = makeRetrySlackDelivery({
    getVerifiedUser: async () => ({
      id: role === "admin" ? "admin-a" : "employee",
      role,
      name: "Tony",
      imageUrl: null,
    }),
    findDelivery: async () => ({
      id: "11111111-1111-4111-8111-111111111111",
      status,
    }),
    resetDelivery: async (id) => {
      calls.push(`reset:${id}`);
    },
    recordAudit: async (actorId, id) => {
      calls.push(`audit:${actorId}:${id}`);
    },
    revalidatePath: (path) => calls.push(`refresh:${path}`),
  });
  return { action, calls };
}

describe("retry Slack delivery", () => {
  it("does not let an employee retry a message", async () => {
    const { action, calls } = setup("failed", "employee");

    await expect(
      action("11111111-1111-4111-8111-111111111111")
    ).resolves.toEqual({ ok: false, message: "只有管理员可以重发通知。" });
    expect(calls).toEqual([]);
  });

  it("does not retry a message that was already sent", async () => {
    const { action, calls } = setup("sent");

    await expect(
      action("11111111-1111-4111-8111-111111111111")
    ).resolves.toEqual({ ok: false, message: "这条消息已经发送成功。" });
    expect(calls).toEqual([]);
  });

  it("resets a failed message and records who requested it", async () => {
    const { action, calls } = setup();

    await expect(
      action("11111111-1111-4111-8111-111111111111")
    ).resolves.toEqual({ ok: true });
    expect(calls).toEqual([
      "reset:11111111-1111-4111-8111-111111111111",
      "audit:admin-a:11111111-1111-4111-8111-111111111111",
      "refresh:/admin/history",
    ]);
  });
});
