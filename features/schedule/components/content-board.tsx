"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { contentBoardMoveMessage } from "@/features/schedule/board-rules";
import { malaysiaDateTimeFormatter } from "@/features/schedule/date";
import type { ScheduledContent } from "@/features/schedule/types";

type BoardStatus = ScheduledContent["status"];
type MoveResult = { ok: true } | { ok: false; message: string };

const columns: { status: BoardStatus; label: string; color: string }[] = [
  { status: "draft", label: "草稿", color: "bg-slate-500" },
  { status: "in_review", label: "等待审核", color: "bg-amber-500" },
  { status: "changes_requested", label: "需要修改", color: "bg-red-500" },
  { status: "approved", label: "已经批准", color: "bg-emerald-500" },
  { status: "due", label: "等待发布", color: "bg-violet-500" },
  { status: "published", label: "已经发布", color: "bg-blue-500" },
];

export { contentBoardMoveMessage } from "@/features/schedule/board-rules";

export function ContentBoard({
  initialContents,
  moveAction = async () => ({
    ok: false,
    message: "暂时无法移动，请稍后再试。",
  }),
  onMoved,
}: {
  initialContents: ScheduledContent[];
  moveAction?: (
    contentId: string,
    status: "draft" | "changes_requested"
  ) => Promise<MoveResult>;
  onMoved?: () => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const contents = initialContents;

  async function moveContent(current: ScheduledContent, target: BoardStatus) {
    setDraggedId(null);
    const blocked = contentBoardMoveMessage(current.status, target);
    if (blocked) {
      setMessage(blocked);
      return;
    }
    if (current.status === target) return;
    if (target !== "draft" && target !== "changes_requested") return;

    setMovingId(current.id);
    const result = await moveAction(current.id, target);
    setMovingId(null);
    if (!result.ok) {
      setMessage(result.message);
    } else {
      setMessage(null);
      onMoved?.();
    }
  }

  async function handleDrop(target: BoardStatus) {
    const current = contents.find(({ id }) => id === draggedId);
    if (!current) return;
    await moveContent(current, target);
  }

  return (
    <div>
      {message ? (
        <p role="alert" className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {message}
        </p>
      ) : null}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const items = contents.filter(({ status }) => status === column.status);
          return (
            <section
              key={column.status}
              role="region"
              aria-label={column.label}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => void handleDrop(column.status)}
              className="min-h-48 w-[280px] shrink-0 rounded-2xl border bg-muted/40 p-2 sm:w-[310px]"
            >
              <div className="mb-2 flex items-center justify-between px-1 py-1">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${column.color}`} />
                  <h2 className="text-sm font-medium">{column.label}</h2>
                </div>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((content) => (
                  <article
                    key={content.id}
                    draggable
                    onDragStart={() => setDraggedId(content.id)}
                    className="cursor-grab rounded-xl border bg-background p-4 shadow-xs active:cursor-grabbing"
                  >
                    <Link href={`/content/${content.id}`} className="text-sm font-medium hover:underline">
                      {content.title}
                    </Link>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {content.assignee.name} · {malaysiaDateTimeFormatter.format(new Date(content.publishAt))}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      已批准 {new Set(content.approvalAdminIds).size}/{content.requiredApprovals}
                    </p>
                    {content.status === "draft" || content.status === "changes_requested" ? (
                      <Button
                        aria-label={
                          content.status === "draft"
                            ? `把${content.title}移动到需要修改`
                            : `把${content.title}移回草稿`
                        }
                        className="mt-3 w-full"
                        disabled={movingId === content.id}
                        onClick={() =>
                          void moveContent(
                            content,
                            content.status === "draft" ? "changes_requested" : "draft"
                          )
                        }
                        size="xs"
                        type="button"
                        variant="outline"
                      >
                        {movingId === content.id
                          ? "正在移动…"
                          : content.status === "draft"
                            ? "移动到需要修改"
                            : "移回草稿"}
                      </Button>
                    ) : null}
                  </article>
                ))}
                {items.length === 0 ? (
                  <p className="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground">
                    暂时没有内容
                  </p>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
