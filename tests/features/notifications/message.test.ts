import { describe, expect, it } from "vitest";

import { buildSlackMessage } from "@/features/notifications/message";

const content = {
  id: "8e49db64-75f5-4bd5-98ab-95652c49ab80",
  title: "八月新品介绍",
  publishAt: "2026-08-29T07:15:00.000Z",
  assigneeName: "Tony",
  actorName: "上司 A",
  platformNames: ["Instagram", "LinkedIn"],
};

describe("Slack notification messages", () => {
  it("tells the employee to check publishing only when approved content is due", () => {
    const message = buildSlackMessage(
      { event: "publish_due", content },
      "https://tasklb.vercel.app"
    );

    expect(message.text).toContain("请 Tony 确认是否已经发布");
    expect(message.text).toContain("八月新品介绍");
    expect(message.blocks.at(-1)).toMatchObject({
      type: "actions",
      elements: [
        expect.objectContaining({
          type: "button",
          url: "https://tasklb.vercel.app/content/8e49db64-75f5-4bd5-98ab-95652c49ab80",
        }),
      ],
    });
  });

  it("alerts admins without asking the employee to publish when approval is missing", () => {
    const message = buildSlackMessage(
      { event: "publish_due_unapproved", content },
      "https://tasklb.vercel.app/"
    );

    expect(message.text).toContain("还没批准完成");
    expect(message.text).not.toContain("确认是否已经发布");
    expect(message.text).not.toContain("请现在发布");
  });

  it("uses Malaysian time and includes the selected platforms", () => {
    const message = buildSlackMessage(
      { event: "publish_advance", content },
      "https://tasklb.vercel.app"
    );
    const details = JSON.stringify(message.blocks);

    expect(details).toContain("29/08/2026");
    expect(details).toContain("3:15 pm");
    expect(details).toContain("Instagram、LinkedIn");
  });
});
