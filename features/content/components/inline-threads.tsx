"use client";

import type { BlockNoteEditor } from "@blocknote/core";
import type { ThreadData } from "@liveblocks/client";
import { useMarkThreadAsUnresolved } from "@liveblocks/react/suspense";
import { Thread } from "@liveblocks/react-ui";
import { useState, useSyncExternalStore } from "react";

const desktopQuery = "(min-width: 1024px)";

function subscribeToViewport(onChange: () => void) {
  const mediaQuery = window.matchMedia(desktopQuery);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getDesktopSnapshot() {
  return window.matchMedia(desktopQuery).matches;
}

function getDesktopServerSnapshot() {
  return true;
}

function scrollToThreadText(threadId: string) {
  const mark = Array.from(
    document.querySelectorAll<HTMLElement>("[data-lb-thread-id]")
  ).find((element) => element.dataset.lbThreadId === threadId);
  mark?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function InlineThreads({
  canClearResolved = false,
  onClearResolved,
  threads,
}: {
  canClearResolved?: boolean;
  editor: BlockNoteEditor;
  onClearResolved?: () => Promise<
    | { ok: true; deleted: number }
    | { ok: false; message: string }
  >;
  threads: ThreadData[];
}) {
  const [view, setView] = useState<"open" | "resolved">("open");
  const [clearing, setClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState<string | null>(null);
  const markThreadAsUnresolved = useMarkThreadAsUnresolved();
  const isDesktop = useSyncExternalStore(
    subscribeToViewport,
    getDesktopSnapshot,
    getDesktopServerSnapshot
  );
  const openThreads = threads.filter((thread) => !thread.resolved);
  const resolvedThreads = threads.filter((thread) => thread.resolved);

  const emptyState = (
    <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
      这个分类还没有留言
    </p>
  );

  const resolvedThreadList = resolvedThreads.length > 0 ? (
    <div className="space-y-3">
      {resolvedThreads.map((thread) => (
        <div key={thread.id} className="space-y-2">
          <Thread
            thread={thread}
            showComposer={false}
            showResolveAction={false}
          />
          <button
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
            onClick={() => markThreadAsUnresolved(thread.id)}
            type="button"
          >
            重新打开
          </button>
        </div>
      ))}
    </div>
  ) : (
    emptyState
  );

  const openThreadList = openThreads.length > 0 ? (
    <div className="space-y-3">
      {openThreads.map((thread) => (
        <Thread
          key={thread.id}
          className="cursor-pointer"
          onClick={() => scrollToThreadText(thread.id)}
          thread={thread}
          showComposer="collapsed"
          showResolveAction
        />
      ))}
    </div>
  ) : (
    emptyState
  );

  async function handleClearResolved() {
    if (
      !window.confirm(
        `确定要永久删除 ${resolvedThreads.length} 条已解决留言吗？删除后不能恢复。`
      )
    ) {
      return;
    }
    if (!onClearResolved) return;

    setClearing(true);
    setClearMessage(null);
    const result = await onClearResolved();
    setClearing(false);
    setClearMessage(
      result.ok
        ? `已经清空 ${result.deleted} 条已解决留言。`
        : result.message
    );
  }

  const clearResolvedButton =
    view === "resolved" && canClearResolved && resolvedThreads.length > 0 ? (
      <div className="mb-3 space-y-2">
        <button
          className="w-full rounded-md border border-destructive/40 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
          disabled={clearing}
          onClick={handleClearResolved}
          type="button"
        >
          {clearing ? "正在清空…" : "清空已解决"}
        </button>
        {clearMessage ? (
          <p aria-live="polite" className="text-xs text-muted-foreground">
            {clearMessage}
          </p>
        ) : null}
      </div>
    ) : null;

  const filters = (
    <div
      aria-label="指定文字留言"
      className="mb-3 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
      role="group"
    >
      <button
        aria-pressed={view === "open"}
        className="rounded-md px-3 py-2 text-sm aria-pressed:bg-background aria-pressed:font-medium aria-pressed:shadow-sm"
        onClick={() => setView("open")}
        type="button"
      >
        未解决 {openThreads.length}
      </button>
      <button
        aria-pressed={view === "resolved"}
        className="rounded-md px-3 py-2 text-sm aria-pressed:bg-background aria-pressed:font-medium aria-pressed:shadow-sm"
        onClick={() => setView("resolved")}
        type="button"
      >
        已解决 {resolvedThreads.length}
      </button>
    </div>
  );

  return isDesktop ? (
    <div data-testid="anchored-threads" className="w-80 min-w-0 shrink-0">
      {filters}
      {clearResolvedButton}
      {view === "resolved" ? resolvedThreadList : openThreadList}
    </div>
  ) : (
    <div data-testid="floating-threads" className="w-full min-w-0">
      {filters}
      {clearResolvedButton}
      {view === "resolved" ? resolvedThreadList : openThreadList}
    </div>
  );
}
