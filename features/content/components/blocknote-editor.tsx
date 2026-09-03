"use client";

import { BlockNoteView } from "@blocknote/mantine";
import type { ThreadData } from "@liveblocks/client";
import {
  FloatingComposer,
  useCreateBlockNoteWithLiveblocks,
  useIsEditorReady,
} from "@liveblocks/react-blocknote";
import {
  useRoom,
  useStatus,
  useSyncStatus,
  useThreads,
} from "@liveblocks/react/suspense";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { InlineThreads } from "@/features/content/components/inline-threads";

type ConnectionStatus = ReturnType<typeof useStatus>;

const threadRefreshIntervalMs = 3_000;

function mergeThreads(
  liveThreads: ThreadData[],
  polledThreads: ThreadData[]
) {
  const threadsById = new Map(
    polledThreads.map((thread) => [thread.id, thread] as const)
  );
  for (const thread of liveThreads) threadsById.set(thread.id, thread);
  return Array.from(threadsById.values());
}

type PasteHandlerContext = {
  event: ClipboardEvent;
  editor: { pasteMarkdown: (markdown: string) => void };
  defaultPasteHandler: (options?: {
    prioritizeMarkdownOverHTML?: boolean;
    plainTextAsMarkdown?: boolean;
  }) => boolean | undefined;
};

export function preserveParagraphsOnPaste({
  event,
  editor,
  defaultPasteHandler,
}: PasteHandlerContext): boolean | undefined {
  const clipboard = event.clipboardData;
  if (!clipboard) return defaultPasteHandler();

  const types = Array.from(clipboard.types);
  if (types.includes("text/html") || types.includes("blocknote/html")) {
    return defaultPasteHandler({
      prioritizeMarkdownOverHTML: false,
      plainTextAsMarkdown: false,
    });
  }

  if (!types.includes("text/plain")) return defaultPasteHandler();

  const text = clipboard.getData("text/plain");
  if (!text.includes("\n") && !text.includes("\r")) {
    return defaultPasteHandler();
  }

  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => (line.trim() === "\\" ? "" : line))
    .filter((line) => line.trim().length > 0);

  editor.pasteMarkdown(paragraphs.join("\n\n"));
  return true;
}

export function EditorSyncStatus({
  ready,
  status,
}: {
  ready: boolean;
  status: ConnectionStatus;
}) {
  if (!ready) {
    return (
      <div className="min-h-72 animate-pulse rounded-xl bg-muted/50 p-6 text-sm text-muted-foreground">
        正在打开内容…
      </div>
    );
  }

  const synchronized = status === "connected";
  return (
    <p
      aria-live="polite"
      className={`text-xs ${synchronized ? "text-emerald-700" : "text-amber-700"}`}
    >
      {synchronized ? "已经同步" : "尚未同步"}
    </p>
  );
}

export function BlockNoteEditor({
  canClearResolved = false,
  editable,
  onClearResolved,
  onDocumentChange,
  onSyncChange,
}: {
  canClearResolved?: boolean;
  contentId: string;
  editable: boolean;
  onClearResolved?: () => Promise<
    | { ok: true; deleted: number }
    | { ok: false; message: string }
  >;
  onDocumentChange?: (document: unknown) => void;
  onSyncChange?: (synchronized: boolean) => void;
}) {
  const editor = useCreateBlockNoteWithLiveblocks(
    { pasteHandler: preserveParagraphsOnPaste },
    { field: "document", offlineSupport_experimental: false }
  );
  const ready = useIsEditorReady();
  const status = useStatus();
  const syncStatus = useSyncStatus();
  const { threads } = useThreads();
  const room = useRoom();
  const [polledThreads, setPolledThreads] = useState<ThreadData[]>([]);
  const visibleThreads = mergeThreads(threads, polledThreads);
  const { resolvedTheme } = useTheme();
  const blockNoteTheme = resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    if (ready) onDocumentChange?.(editor.document);
  }, [editor, onDocumentChange, ready]);
  useEffect(() => {
    onSyncChange?.(ready && syncStatus === "synchronized");
  }, [onSyncChange, ready, syncStatus]);
  useEffect(() => {
    let cancelled = false;

    async function refreshThreads() {
      if (document.visibilityState === "hidden") return;
      try {
        const result = await room.getThreads();
        if (!cancelled) setPolledThreads(result.threads);
      } catch {
        // Keep the last known threads; Liveblocks will retry its connection.
      }
    }

    const interval = window.setInterval(
      () => void refreshThreads(),
      threadRefreshIntervalMs
    );
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [room]);

  if (!ready) {
    return <EditorSyncStatus ready={false} status={status} />;
  }

  return (
    <section className="space-y-2" data-testid="content-editor">
      <div
        data-testid="editor-and-comments-layout"
        className="flex min-w-0 flex-col items-stretch gap-4 lg:flex-row lg:items-start"
      >
        <div className="min-h-72 w-full min-w-0 flex-1 overflow-hidden rounded-xl border bg-background py-4">
          <BlockNoteView
            editor={editor}
            editable={editable}
            theme={blockNoteTheme}
            onChange={() => onDocumentChange?.(editor.document)}
          />
          <FloatingComposer
            editor={editor}
            className="max-w-[calc(100vw-3rem)] sm:w-[22rem]"
          />
        </div>
        <InlineThreads
          canClearResolved={canClearResolved}
          editor={editor}
          onClearResolved={onClearResolved}
          threads={visibleThreads}
        />
      </div>
      <EditorSyncStatus ready status={status} />
    </section>
  );
}
