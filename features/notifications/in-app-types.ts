export type InAppNotification = {
  id: string;
  recipientId: string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};
