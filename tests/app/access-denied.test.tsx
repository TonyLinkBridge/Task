import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AccessDeniedPage from "@/app/access-denied/page";

describe("access denied page", () => {
  it("explains that the Slack workspace is not allowed", async () => {
    render(await AccessDeniedPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { name: "无法进入内部工作台" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("请使用指定 Slack Workspace 的账号登录。")
    ).toBeInTheDocument();
  });

  it("explains administrator permission when an employee opens an admin page", async () => {
    render(
      await AccessDeniedPage({
        searchParams: Promise.resolve({ reason: "admin-only" }),
      })
    );

    expect(
      screen.getByRole("heading", { name: "只有管理员可以进入" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("你的账号是员工，仍然可以继续使用任务和内容排期。")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "返回任务页面" })
    ).toHaveAttribute("href", "/tasks");
  });
});
