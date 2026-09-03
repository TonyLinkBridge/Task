import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeHelpFeedbackActions } from "@/features/help-center/feedback/actions";
import { HelpPageFeedback } from "@/features/help-center/gitbook/page-feedback";

describe("help article feedback", () => {
  it("saves a helpful vote for the verified member", async () => {
    const saved: unknown[] = [];
    const actions = makeHelpFeedbackActions({
      getVerifiedUser: async () => ({
        id: "employee",
        role: "employee",
        name: "员工",
        imageUrl: null,
      }),
      saveFeedback: async (input) => void saved.push(input),
    });

    await expect(
      actions.saveHelpFeedback({ articleSlug: "内容审核/提交审核", helpful: true })
    ).resolves.toEqual({ ok: true, message: "谢谢你的反馈。" });
    expect(saved).toEqual([
      {
        articleSlug: "内容审核/提交审核",
        clerkUserId: "employee",
        helpful: true,
        comment: null,
      },
    ]);
  });

  it("asks what was unclear and thanks the member after saving", async () => {
    const saved: unknown[] = [];
    render(
      <HelpPageFeedback
        articleSlug="内容审核/提交审核"
        saveAction={async (input) => {
          saved.push(input);
          return { ok: true, message: "谢谢你的反馈。" };
        }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "没帮助" }));
    fireEvent.change(screen.getByLabelText("哪里不清楚？"), {
      target: { value: "批准步骤不清楚" },
    });
    fireEvent.click(screen.getByRole("button", { name: "送出反馈" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("谢谢你的反馈。"));
    expect(saved).toEqual([
      {
        articleSlug: "内容审核/提交审核",
        helpful: false,
        comment: "批准步骤不清楚",
      },
    ]);
  });
});
