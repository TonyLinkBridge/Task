export type SlackDeliveryView = {
  id: string;
  eventType: string;
  status: "pending" | "sending" | "sent" | "failed" | "cancelled";
  attemptCount: number;
  scheduledFor: string;
  sentAt: string | null;
  lastError: string | null;
  channelId: string;
  contentTitle: string | null;
};

export type AuditEventView = {
  id: string;
  actorName: string | null;
  entityType: string;
  entityId: string;
  action: string;
  createdAt: string;
};
