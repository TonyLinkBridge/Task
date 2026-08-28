import { makeLiveblocksAuthHandler } from "@/features/content/api/liveblocks-auth-handler";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import { authorizeContentRoom } from "@/lib/liveblocks/server";
import { contentRepository } from "@/features/content/repository";

export const POST = makeLiveblocksAuthHandler({
  getVerifiedUser,
  findContentByRoomId: (roomId) => contentRepository.findByRoomId(roomId),
  authorizeRoom: authorizeContentRoom,
});
