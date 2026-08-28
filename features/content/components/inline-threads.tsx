"use client";

import type { BlockNoteEditor } from "@blocknote/core";
import type { ThreadData } from "@liveblocks/client";
import {
  AnchoredThreads,
  FloatingThreads,
} from "@liveblocks/react-blocknote";
import { useSyncExternalStore } from "react";

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
  const isDesktop = useSyncExternalStore(
    subscribeToViewport,
    getDesktopSnapshot,
    getDesktopServerSnapshot
  );

  return isDesktop ? (
    <div data-testid="anchored-threads" className="w-80 shrink-0">
      <AnchoredThreads
        editor={editor}
        threads={threads}
        className="w-full"
      />
    </div>
  ) : (
    <div data-testid="floating-threads">
      <FloatingThreads
        editor={editor}
        threads={threads}
        className="w-[min(22rem,calc(100vw-2rem))]"
      />
    </div>
  );
}
