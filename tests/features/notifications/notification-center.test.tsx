import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NotificationCenter } from "@/features/notifications/components/notification-center";

afterEach(() => vi.unstubAllGlobals());

describe("NotificationCenter", () => {
  it("shows unread notifications and lets the member mark them read", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          unreadCount: 1,
          notifications: [
            {
              id: "11111111-1111-4111-8111-111111111111",
              recipientId: "user_employee",
              title: "你有新任务",
              body: "准备周报",
              href: "/tasks/22222222-2222-4222-8222-222222222222",
              readAt: null,
              createdAt: "2026-08-31T03:00:00.000Z",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render(<NotificationCenter />);

    expect(
      await screen.findByRole("button", { name: "通知，1 条未读" })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "通知，1 条未读" }));
    expect(screen.getByText("你有新任务")).toBeInTheDocument();
    expect(screen.getByText("准备周报")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "全部设为已读" }));
    await waitFor(() =>
      expect(screen.getByLabelText("通知，0 条未读")).toBeInTheDocument()
    );
    expect(fetchMock).toHaveBeenLastCalledWith("/api/notifications", {
      method: "PATCH",
    });
  });
});
