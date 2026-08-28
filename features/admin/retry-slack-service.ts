import { z } from "zod";

import type { VerifiedUser } from "@/lib/auth/types";

type DeliveryStatus = "pending" | "sending" | "sent" | "failed" | "cancelled";

export function makeRetrySlackDelivery(dependencies: {
  getVerifiedUser: () => Promise<VerifiedUser>;
  findDelivery: (id: string) => Promise<{ id: string; status: DeliveryStatus } | null>;
  resetDelivery: (id: string) => Promise<void>;
  recordAudit: (actorId: string, id: string) => Promise<void>;
  revalidatePath: (path: string) => void;
}) {
  return async (deliveryId: string) => {
    const user = await dependencies.getVerifiedUser();
    if (user.role !== "admin") {
      return { ok: false as const, message: "只有管理员可以重发通知。" };
    }
    const parsedId = z.uuid().safeParse(deliveryId);
    if (!parsedId.success) {
      return { ok: false as const, message: "找不到这条通知。" };
    }

    const delivery = await dependencies.findDelivery(parsedId.data);
    if (!delivery) {
      return { ok: false as const, message: "找不到这条通知。" };
    }
    if (delivery.status === "sent") {
      return { ok: false as const, message: "这条消息已经发送成功。" };
    }
    if (delivery.status !== "failed") {
      return { ok: false as const, message: "这条消息目前不需要重发。" };
    }

    try {
      await dependencies.resetDelivery(delivery.id);
      await dependencies.recordAudit(user.id, delivery.id);
      dependencies.revalidatePath("/admin/history");
      return { ok: true as const };
    } catch {
      return { ok: false as const, message: "暂时无法重发，请稍后再试。" };
    }
  };
}
