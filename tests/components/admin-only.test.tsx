import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminOnly } from "@/components/auth/admin-only";

describe("AdminOnly", () => {
  it("shows admin content to an administrator", () => {
    render(
      <AdminOnly role="admin">
        <span>管理员设置</span>
      </AdminOnly>
    );

    expect(screen.getByText("管理员设置")).toBeInTheDocument();
  });

  it("hides admin content from an employee", () => {
    render(
      <AdminOnly role="employee">
        <span>管理员设置</span>
      </AdminOnly>
    );

    expect(screen.queryByText("管理员设置")).not.toBeInTheDocument();
  });
});
