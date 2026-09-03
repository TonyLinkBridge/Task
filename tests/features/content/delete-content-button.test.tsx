import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DeleteContentButton } from "@/features/content/components/delete-content-button";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

describe("DeleteContentButton", () => {
  it("warns that Slack notifications disappear before permanently deleting", async () => {
    const user = userEvent.setup();
    const deleteAction = vi.fn(async () => ({ ok: true as const }));
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(
      <DeleteContentButton
        contentId="22222222-2222-4222-8222-222222222222"
        deleteAction={deleteAction}
      />
    );

    await user.click(screen.getByRole("button", { name: "删除内容" }));

    expect(window.confirm).toHaveBeenCalledWith(
      "确定永久删除这个内容吗？相关 Slack 通知也会一起删除，而且不能恢复。"
    );
    expect(deleteAction).toHaveBeenCalledWith(
      "22222222-2222-4222-8222-222222222222"
    );
    expect(push).toHaveBeenCalledWith("/content");
  });
});
