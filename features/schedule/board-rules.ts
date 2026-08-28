import type { ScheduledContent } from "@/features/schedule/types";

type BoardStatus = ScheduledContent["status"];

export function contentBoardMoveMessage(
  from: BoardStatus,
  to: BoardStatus
): string | null {
  if (from === to) return null;
  if (to === "approved") return "必须使用批准按钮，不能直接拖到这里。";
  if (to === "published") return "必须使用已发布按钮，不能直接拖到这里。";
  if (to === "due") return "到了发布时间后，系统才会放到这里。";
  const editablePair = new Set([from, to]);
  if (
    editablePair.size === 2 &&
    editablePair.has("draft") &&
    editablePair.has("changes_requested")
  ) {
    return null;
  }
  return "这个状态要用审核页面里的按钮处理。";
}
