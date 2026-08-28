"use client";

import type { BlockNoteEditor } from "@blocknote/core";
import type { ThreadData } from "@liveblocks/client";
import {
  AnchoredThreads,
  FloatingThreads,
} from "@liveblocks/react-blocknote";
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

export function InlineThreads({
  editor,
  threads,
}: {
  editor: BlockNoteEditor;
  threads: ThreadData[];
}) {
  const [view, setView] = useState<"open" | "resolved">("open");
  const isDesktop = useSyncExternalStore(
    subscribeToViewport,
    getDesktopSnapshot,
    getDesktopServerSnapshot
  );
  const openThreads = threads.filter((thread) => !thread.resolved);
  const resolvedThreads = threads.filter((thread) => thread.resolved);
  const visibleThreads = view === "open" ? openThreads : resolvedThreads;

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
    <div data-testid="anchored-threads" className="w-80 shrink-0">
      {filters}
      {visibleThreads.length > 0 ? (
        <AnchoredThreads
          editor={editor}
          threads={visibleThreads}
          className="w-full"
        />
      ) : (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          这个分类还没有留言
        </p>
      )}
    </div>
  ) : (
    <div data-testid="floating-threads">
      {filters}
      {visibleThreads.length > 0 ? (
        <FloatingThreads
          editor={editor}
          threads={visibleThreads}
          className="w-[min(22rem,calc(100vw-2rem))]"
        />
      ) : (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          这个分类还没有留言
        </p>
      )}
    </div>
  );
}
