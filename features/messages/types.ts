export type MessageMember = {
  id: string;
  name: string;
  imageUrl: string | null;
};

export type PrivateMessage = {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};
