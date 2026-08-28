import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PlatformSettings } from "@/features/admin/components/platform-settings";
import type { ContentPlatform } from "@/features/content/types";

const instagram: ContentPlatform = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Instagram",
  color: "#ec4899",
  archivedAt: null,
  createdAt: "2026-08-28T02:00:00.000Z",
};

describe("PlatformSettings", () => {
  it("creates a custom platform and shows it immediately", async () => {
    const user = userEvent.setup();
    render(
      <PlatformSettings
        initialPlatforms={[instagram]}
        createPlatformAction={async (input) => ({
          ok: true,
          data: {
            id: "22222222-2222-4222-8222-222222222222",
            ...(input as { name: string; color: string }),
            archivedAt: null,
            createdAt: "2026-08-28T03:00:00.000Z",
          },
        })}
      />
    );

    await user.type(screen.getByLabelText("新平台名称"), "TikTok");
    await user.click(screen.getByRole("button", { name: "新增平台" }));

    expect(await screen.findByText("TikTok")).toBeInTheDocument();
    expect(screen.getByText("2 个使用中")).toBeInTheDocument();
  });

  it("can edit and stop an existing platform", async () => {
    const user = userEvent.setup();
    render(
      <PlatformSettings
        initialPlatforms={[instagram]}
        updatePlatformAction={async (id, input) => ({
          ok: true,
          data: { ...instagram, id, ...(input as object), name: "Instagram Reels" },
        })}
        archivePlatformAction={async (id) => ({
          ok: true,
          data: {
            ...instagram,
            id,
            name: "Instagram Reels",
            archivedAt: "2026-08-28T04:00:00.000Z",
          },
        })}
      />
    );

    await user.click(screen.getByRole("button", { name: "修改 Instagram" }));
    await user.clear(screen.getByLabelText("修改平台名称"));
    await user.type(screen.getByLabelText("修改平台名称"), "Instagram Reels");
    await user.click(screen.getByRole("button", { name: "保存修改" }));
    await user.click(
      screen.getByRole("button", { name: "停用 Instagram Reels" })
    );

    expect(await screen.findByText("已经停用")).toBeInTheDocument();
    expect(screen.getByText("0 个使用中 · 1 个已停用")).toBeInTheDocument();
  });
});
