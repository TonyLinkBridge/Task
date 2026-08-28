import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AccessDeniedPage from "@/app/access-denied/page";

describe("access denied page", () => {
  it("explains that the Slack workspace is not allowed", () => {
    render(<AccessDeniedPage />);

    expect(
      screen.getByRole("heading", { name: "无法进入内部工作台" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("请使用指定 Slack Workspace 的账号登录。")
    ).toBeInTheDocument();
  });
});
