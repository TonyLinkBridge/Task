import type {
  NotificationEvent,
  SlackMessageBlock,
  SlackMessageContent,
} from "./notification-types.ts";

const heading: Record<NotificationEvent, string> = {
  submitted: "📝 内容已经提交检查",
  first_approved: "✅ 第一位管理员已经批准",
  all_approved: "✅ 内容已经全部批准",
  changes_requested: "✏️ 管理员要求修改内容",
  resubmitted: "🔁 内容修改后重新提交",
  publish_advance: "⏰ 内容即将到达发布时间",
  publish_due: "🚀 内容已经到达发布时间",
  publish_due_unapproved: "⚠️ 内容已经到达发布时间，但还没批准完成",
  published: "🎉 内容已经确认发布",
};

const malaysiaTime = new Intl.DateTimeFormat("en-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  dateStyle: "short",
  timeStyle: "short",
});

function eventInstruction(
  event: NotificationEvent,
  content: SlackMessageContent
) {
  if (event === "publish_due") {
    return `请 ${content.assigneeName?.trim() || "负责人"} 确认是否已经发布。`;
  }
  if (event === "publish_due_unapproved") {
    return "请管理员尽快检查；暂时不会要求员工发布。";
  }
  if (event === "changes_requested") {
    return "请负责人查看留言并修改内容。";
  }
  if (event === "all_approved") {
    return "审核已经完成，会按照设定时间提醒负责人发布。";
  }
  return "请打开内部工作台查看详情。";
}

export function buildSlackMessage(
  input: { event: NotificationEvent; content: SlackMessageContent },
  appUrl: string
): { text: string; blocks: SlackMessageBlock[] } {
  const { event, content } = input;
  const title = heading[event];
  const instruction = eventInstruction(event, content);
  const platforms = content.platformNames?.length
    ? content.platformNames.join("、")
    : "未填写";
  const detailUrl = new URL(`/content/${content.id}`, appUrl).toString();
  const text = `${title}：${content.title}。${instruction}`;

  return {
    text,
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: `*${title}*\n*${content.title}*` },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: [
            `*发布时间：* ${malaysiaTime.format(new Date(content.publishAt))}`,
            `*平台：* ${platforms}`,
            `*负责人：* ${content.assigneeName?.trim() || "未填写"}`,
            instruction,
          ].join("\n"),
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "打开内容" },
            url: detailUrl,
          },
        ],
      },
    ],
  };
}
