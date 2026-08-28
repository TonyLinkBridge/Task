import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SlackLoginCard } from "@/components/auth/slack-login-card";

describe("SlackLoginCard", () => {
  it("shows the designated workspace and starts Slack login", async () => {
    let continued = false;
    const user = userEvent.setup();
    render(
      <SlackLoginCard
        isLoading={false}
        onContinue={() => {
          continued = true;
        }}
      />
    );

    expect(screen.getByText("juyuco.slack.com")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "使用 JUYU Slack 继续" }));
    expect(continued).toBe(true);
  });

  it("disables the button while Slack is opening", () => {
    render(<SlackLoginCard isLoading onContinue={() => undefined} />);

    expect(screen.getByRole("button", { name: "正在打开 Slack…" })).toBeDisabled();
  });

  it("provides Clerk a CAPTCHA mount point for first-time Slack sign-up", () => {
    render(<SlackLoginCard isLoading={false} onContinue={() => undefined} />);

    expect(document.getElementById("clerk-captcha")).toBeInTheDocument();
  });

  it("explains when Slack login could not open", () => {
    render(
      <SlackLoginCard
        isLoading={false}
        onContinue={() => undefined}
        errorMessage="暂时无法打开 Slack，请稍后再试。"
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "暂时无法打开 Slack，请稍后再试。"
    );
  });
});
