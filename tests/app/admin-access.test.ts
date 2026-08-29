import { beforeEach, describe, expect, it, vi } from "vitest";

const redirect = vi.hoisted(() =>
  vi.fn((path: string): never => {
    throw new Error(`REDIRECT:${path}`);
  })
);

vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth/get-verified-user", () => ({
  getVerifiedUser: vi.fn(async () => ({
    id: "employee-1",
    role: "employee",
    name: "Tony",
    imageUrl: null,
  })),
}));
vi.mock("@/features/admin/repository", () => ({
  adminRepository: {
    listSlackDeliveries: vi.fn(),
    listAuditEvents: vi.fn(),
  },
}));

import AdminHistoryPage from "@/app/(protected)/admin/history/page";

describe("administrator page access", () => {
  beforeEach(() => {
    redirect.mockClear();
  });

  it("sends an employee to the administrator-specific explanation", async () => {
    await expect(AdminHistoryPage()).rejects.toThrow(
      "REDIRECT:/access-denied?reason=admin-only"
    );
  });
});
