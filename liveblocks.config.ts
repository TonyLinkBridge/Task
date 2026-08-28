import type { AppRole } from "@/lib/auth/types";

declare global {
  interface Liveblocks {
    Presence: Record<string, never>;
    Storage: Record<string, never>;
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        role: AppRole;
        color: string;
      };
    };
    RoomEvent: Record<string, never>;
    ThreadMetadata: Record<string, never>;
    CommentMetadata: Record<string, never>;
  }
}

export {};
