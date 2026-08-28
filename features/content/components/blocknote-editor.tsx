"use client";

import { BlockNoteView } from "@blocknote/mantine";
import {
  useCreateBlockNoteWithLiveblocks,
  useIsEditorReady,
} from "@liveblocks/react-blocknote";
import { useStatus } from "@liveblocks/react/suspense";

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

export function BlockNoteEditor({ editable }: { contentId: string; editable: boolean }) {
  const editor = useCreateBlockNoteWithLiveblocks(
    {},
    { field: "document", offlineSupport_experimental: false }
  );
  const ready = useIsEditorReady();
  const status = useStatus();

  if (!ready) {
    return <EditorSyncStatus ready={false} status={status} />;
  }

  return (
    <section className="space-y-2" data-testid="content-editor">
      <div className="min-h-72 overflow-hidden rounded-xl border bg-background py-4">
        <BlockNoteView editor={editor} editable={editable} />
      </div>
      <EditorSyncStatus ready status={status} />
    </section>
  );
}
