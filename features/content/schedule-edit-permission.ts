import { canEditBody } from "@/features/approval/rules";
import type { ContentRecord } from "@/features/content/types";
import type { VerifiedUser } from "@/lib/auth/types";

export function canEditContentSchedule(
  content: ContentRecord,
  user: VerifiedUser
): boolean {
  return (
    canEditBody(content.status) &&
    (user.role === "admin" ||
      user.id === content.authorId ||
      user.id === content.assigneeId)
  );
}
