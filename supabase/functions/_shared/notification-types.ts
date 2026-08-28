export const NOTIFICATION_EVENTS = [
  "submitted",
  "first_approved",
  "all_approved",
  "changes_requested",
  "resubmitted",
  "publish_advance",
  "publish_due",
  "publish_due_unapproved",
  "published",
] as const;

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

export type SlackMessageContent = {
  id: string;
  title: string;
  publishAt: string;
  assigneeName?: string | null;
  actorName?: string | null;
  platformNames?: string[];
};

export type SlackMessageBlock =
  | { type: "section"; text: { type: "mrkdwn"; text: string } }
  | {
      type: "actions";
      elements: Array<{
        type: "button";
        text: { type: "plain_text"; text: string };
        url: string;
      }>;
    };
