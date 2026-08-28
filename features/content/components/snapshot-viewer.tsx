"use client";

import type { PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";

export function SnapshotViewer({ document }: { document: unknown }) {
  const initialContent =
    Array.isArray(document) && document.length > 0
      ? (document as PartialBlock[])
      : undefined;
  const editor = useCreateBlockNote({ initialContent });

  return (
    <div className="min-h-48 overflow-hidden rounded-xl border bg-background py-4" data-testid="content-snapshot">
      <BlockNoteView editor={editor} editable={false} />
    </div>
  );
}
