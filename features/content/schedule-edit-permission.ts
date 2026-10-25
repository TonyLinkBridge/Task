import {hasPermission} from "@/features/team/permissions";
import { canEditBody } from "@/features/approval/rules";
import type { ContentRecord } from "@/features/content/types";
import type { VerifiedUser } from "@/lib/auth/types";

export function canEditContentSchedule(
  content: ContentRecord,
  user: VerifiedUser
): boolean {
  return hasPermission(user,"content.reschedule") && (
    canEditBody(content.status) &&
    (hasPermission(user,"content.manage_all") ||
      user.id === content.authorId ||
      user.id === content.assigneeId)
  );
}
