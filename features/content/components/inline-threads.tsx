"use client";

import type { BlockNoteEditor } from "@blocknote/core";
import type { ThreadData } from "@liveblocks/client";
import {
  AnchoredThreads,
  FloatingThreads,
} from "@liveblocks/react-blocknote";

export function InlineThreads({
  editor,
  threads,
}: {
  editor: BlockNoteEditor;
  threads: ThreadData[];
}) {
  return (
    <>
      <div
        data-testid="anchored-threads"
        className="hidden w-80 shrink-0 lg:block"
      >
        <AnchoredThreads
          editor={editor}
          threads={threads}
          className="w-full"
        />
      </div>
      <div data-testid="floating-threads" className="lg:hidden">
        <FloatingThreads
          editor={editor}
          threads={threads}
          className="w-[min(22rem,calc(100vw-2rem))]"
        />
      </div>
    </>
  );
}
