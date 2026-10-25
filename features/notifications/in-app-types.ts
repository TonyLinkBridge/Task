export type InAppNotification = {
  id: string;
  recipientId: string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
  /** Hidden from the bell, retained in the inbox/history. */
  dismissedAt?: string | null;
};

export type NotificationMutation = 'read' | 'unread' | 'dismiss';
