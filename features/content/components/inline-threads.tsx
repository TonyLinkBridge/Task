"use client";

import type { BlockNoteEditor } from "@blocknote/core";
import type { ThreadData } from "@liveblocks/client";
import { FloatingThreads } from "@liveblocks/react-blocknote";

export function InlineThreads({
  editor,
  threads,
}: {
  editor: BlockNoteEditor;
  threads: ThreadData[];
}) {
  return (
    <div
      data-testid="floating-threads"
      className="pointer-events-none absolute inset-0 z-20 [&>*]:pointer-events-auto"
    >
      <FloatingThreads
        editor={editor}
        threads={threads}
        className="w-[min(22rem,calc(100vw-2rem))]"
      />
    </div>
  );
}
