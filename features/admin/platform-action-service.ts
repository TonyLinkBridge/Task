import { z } from "zod";

import type { ContentPlatform } from "@/features/content/types";
import type { VerifiedUser } from "@/lib/auth/types";

const platformInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

type PlatformInput = z.infer<typeof platformInputSchema>;

type Dependencies = {
  getVerifiedUser: () => Promise<VerifiedUser>;
  create: (input: PlatformInput) => Promise<ContentPlatform>;
  update: (id: string, input: PlatformInput) => Promise<ContentPlatform>;
  setArchived: (id: string, archived: boolean) => Promise<ContentPlatform>;
  recordAudit: (
    actorId: string,
    action: "platform_created" | "platform_updated" | "platform_archived" | "platform_restored",
    platform: ContentPlatform
  ) => Promise<void>;
  revalidatePath: (path: string) => void;
};

type PlatformActionResult =
  | { ok: true; data: ContentPlatform }
  | { ok: false; message: string };

const ADMIN_ONLY_MESSAGE = "只有管理员可以管理发布平台。";

function refreshPlatformPages(revalidatePath: (path: string) => void) {
  revalidatePath("/admin/settings");
  revalidatePath("/content/new");
  revalidatePath("/content");
}

export function makePlatformActions(dependencies: Dependencies) {
  async function authorize() {
    const user = await dependencies.getVerifiedUser();
    return user.role === "admin" ? user : null;
  }

  async function save(
    actorId: string,
    action: "platform_created" | "platform_updated" | "platform_archived" | "platform_restored",
    operation: () => Promise<ContentPlatform>
  ): Promise<PlatformActionResult> {
    try {
      const data = await operation();
      await dependencies.recordAudit(actorId, action, data);
      refreshPlatformPages(dependencies.revalidatePath);
      return { ok: true, data };
    } catch {
      return { ok: false, message: "暂时无法保存平台，请稍后再试。" };
    }
  }

  return {
    async createPlatform(input: unknown): Promise<PlatformActionResult> {
      const user = await authorize();
      if (!user) {
        return { ok: false, message: ADMIN_ONLY_MESSAGE };
      }
      const parsed = platformInputSchema.safeParse(input);
      if (!parsed.success) {
        return { ok: false, message: "请检查平台名称和颜色。" };
      }
      return save(user.id, "platform_created", () => dependencies.create(parsed.data));
    },

    async updatePlatform(
      id: string,
      input: unknown
    ): Promise<PlatformActionResult> {
      const user = await authorize();
      if (!user) {
        return { ok: false, message: ADMIN_ONLY_MESSAGE };
      }
      const parsedId = z.uuid().safeParse(id);
      const parsedInput = platformInputSchema.safeParse(input);
      if (!parsedId.success || !parsedInput.success) {
        return { ok: false, message: "请检查平台名称和颜色。" };
      }
      return save(user.id, "platform_updated", () =>
        dependencies.update(parsedId.data, parsedInput.data)
      );
    },

    async archivePlatform(id: string): Promise<PlatformActionResult> {
      const user = await authorize();
      if (!user) {
        return { ok: false, message: ADMIN_ONLY_MESSAGE };
      }
      const parsedId = z.uuid().safeParse(id);
      if (!parsedId.success) {
        return { ok: false, message: "找不到这个平台。" };
      }
      return save(user.id, "platform_archived", () =>
        dependencies.setArchived(parsedId.data, true)
      );
    },

    async restorePlatform(id: string): Promise<PlatformActionResult> {
      const user = await authorize();
      if (!user) {
        return { ok: false, message: ADMIN_ONLY_MESSAGE };
      }
      const parsedId = z.uuid().safeParse(id);
      if (!parsedId.success) {
        return { ok: false, message: "找不到这个平台。" };
      }
      return save(user.id, "platform_restored", () =>
        dependencies.setArchived(parsedId.data, false)
      );
    },
  };
}
