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

export type NotificationEventSettings = Record<NotificationEvent, boolean>;

export const DEFAULT_NOTIFICATION_EVENTS: NotificationEventSettings = {
  submitted: true,
  first_approved: true,
  all_approved: true,
  changes_requested: true,
  resubmitted: true,
  publish_advance: true,
  publish_due: true,
  publish_due_unapproved: true,
  published: true,
};

export type NotificationSettings = {
  slackChannelId: string | null;
  slackChannelName: string | null;
  reminderMinutes: number;
  enabledEvents: NotificationEventSettings;
  updatedBy: string | null;
  updatedAt: string;
};
