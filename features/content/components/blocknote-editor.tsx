"use client";

import { BlockNoteView } from "@blocknote/mantine";
import {
  FloatingComposer,
  useCreateBlockNoteWithLiveblocks,
  useIsEditorReady,
} from "@liveblocks/react-blocknote";
import { useStatus, useThreads } from "@liveblocks/react/suspense";
import { useEffect } from "react";

import { InlineThreads } from "@/features/content/components/inline-threads";

type ConnectionStatus = ReturnType<typeof useStatus>;

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
  editable,
  onDocumentChange,
}: {
  contentId: string;
  editable: boolean;
  onDocumentChange?: (document: unknown) => void;
}) {
  const editor = useCreateBlockNoteWithLiveblocks(
    {},
    { field: "document", offlineSupport_experimental: false }
  );
  const ready = useIsEditorReady();
  const status = useStatus();
  const { threads } = useThreads({ query: { resolved: false } });

  useEffect(() => {
    if (ready) onDocumentChange?.(editor.document);
  }, [editor, onDocumentChange, ready]);

  if (!ready) {
    return <EditorSyncStatus ready={false} status={status} />;
  }

  return (
    <section className="space-y-2" data-testid="content-editor">
      <div className="flex items-start gap-4">
        <div className="min-h-72 min-w-0 flex-1 overflow-hidden rounded-xl border bg-background py-4">
          <BlockNoteView
            editor={editor}
            editable={editable}
            onChange={() => onDocumentChange?.(editor.document)}
          />
          <FloatingComposer editor={editor} className="w-[22rem]" />
        </div>
        <InlineThreads editor={editor} threads={threads} />
      </div>
      <EditorSyncStatus ready status={status} />
    </section>
  );
}
