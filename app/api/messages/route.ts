import { makePrivateMessagesHandler } from "@/features/messages/private-messages-handler";
import { privateMessagesRepository } from "@/features/messages/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

const handler = makePrivateMessagesHandler({
  getVerifiedUser,
  list: (userId) => privateMessagesRepository.list(userId),
  listMembers: (userId) => privateMessagesRepository.listMembers(userId),
  send: (input) => privateMessagesRepository.send(input),
  markReceivedRead: (userId) =>
    privateMessagesRepository.markReceivedRead(userId),
});

export const GET = handler.GET;
export const POST = handler.POST;
export const PATCH = handler.PATCH;
