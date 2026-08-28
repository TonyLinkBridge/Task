"use client";

import type { PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { useTheme } from "next-themes";

export function SnapshotViewer({ document }: { document: unknown }) {
  const initialContent =
    Array.isArray(document) && document.length > 0
      ? (document as PartialBlock[])
      : undefined;
  const editor = useCreateBlockNote({ initialContent });
  const { resolvedTheme } = useTheme();
  const blockNoteTheme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <div className="min-h-48 overflow-hidden rounded-xl border bg-background py-4" data-testid="content-snapshot">
      <BlockNoteView
        editor={editor}
        editable={false}
        theme={blockNoteTheme}
      />
    </div>
  );
}
