import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { blockNoteOptions, liveThreads, roomThreads } = vi.hoisted(() => ({
  blockNoteOptions: {
    current: null as null | Record<string, unknown>,
  },
  liveThreads: {
    current: [] as Array<{ id: string; resolved: boolean }>,
  },
  roomThreads: {
    current: [] as Array<{ id: string; resolved: boolean }>,
  },
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

vi.mock("@blocknote/mantine", () => ({
  BlockNoteView: ({ theme }: { theme?: string }) => (
    <div data-testid="blocknote-view" data-theme={theme ?? "unset"} />
  ),
}));

vi.mock("@liveblocks/react-blocknote", () => ({
  FloatingComposer: () => null,
  useCreateBlockNoteWithLiveblocks: (options: Record<string, unknown>) => {
    blockNoteOptions.current = options;
    return { document: [] };
  },
  useIsEditorReady: () => true,
}));

vi.mock("@liveblocks/react/suspense", () => ({
  useStatus: () => "connected",
  useSyncStatus: () => "synchronized",
  useThreads: () => ({ threads: liveThreads.current }),
  useRoom: () => ({
    getThreads: async () => ({
      threads: roomThreads.current,
      inboxNotifications: [],
      subscriptions: [],
      requestedAt: new Date("2026-09-02T03:00:00.000Z"),
      nextCursor: null,
      permissionHints: {},
    }),
  }),
}));

vi.mock("@/features/content/components/inline-threads", () => ({
  InlineThreads: ({ threads }: { threads: Array<{ id: string }> }) => (
    <div data-testid="inline-threads">{threads.length}</div>
  ),
}));

import {
  BlockNoteEditor,
  EditorSyncStatus,
} from "@/features/content/components/blocknote-editor";

describe("EditorSyncStatus", () => {
  it("shows a loading skeleton before the editor is ready", () => {
    render(<EditorSyncStatus ready={false} status="connecting" />);

    expect(screen.getByText("正在打开内容…")).toBeInTheDocument();
  });

  it("warns when changes have not reached the server", () => {
    render(<EditorSyncStatus ready status="reconnecting" />);

    expect(screen.getByText("尚未同步")).toBeInTheDocument();
  });

  it("confirms when changes are synchronized", () => {
    render(<EditorSyncStatus ready status="connected" />);

    expect(screen.getByText("已经同步")).toBeInTheDocument();
  });
});

describe("BlockNoteEditor", () => {
  afterEach(() => {
    vi.useRealTimers();
    liveThreads.current = [];
    roomThreads.current = [];
  });

  it("keeps every pasted social-post line as a separate paragraph", () => {
    render(<BlockNoteEditor contentId="content-1" editable />);

    const pasteHandler = blockNoteOptions.current?.pasteHandler as
      | ((context: {
          event: ClipboardEvent;
          editor: { pasteMarkdown: (markdown: string) => void };
          defaultPasteHandler: (options?: {
            prioritizeMarkdownOverHTML?: boolean;
            plainTextAsMarkdown?: boolean;
          }) => boolean | undefined;
        }) => boolean | undefined)
      | undefined;
    const pasteMarkdown = vi.fn();
    const defaultPasteHandler = vi.fn();

    expect(pasteHandler).toBeTypeOf("function");
    pasteHandler?.({
      event: {
        clipboardData: {
          types: ["text/plain"],
          getData: () => "第一段\n\\\n第二段\n\n**第三段**",
        },
      } as unknown as ClipboardEvent,
      editor: { pasteMarkdown },
      defaultPasteHandler,
    });

    expect(pasteMarkdown).toHaveBeenCalledWith(
      "第一段\n\n第二段\n\n**第三段**"
    );
    expect(defaultPasteHandler).not.toHaveBeenCalled();
  });

  it("uses the page's light theme instead of the computer's dark theme", () => {
    render(<BlockNoteEditor contentId="content-1" editable />);

    expect(screen.getByTestId("blocknote-view")).toHaveAttribute(
      "data-theme",
      "light"
    );
  });

  it("stacks the editor and comments on a phone to prevent overlap", () => {
    render(<BlockNoteEditor contentId="content-1" editable />);

    expect(screen.getByTestId("editor-and-comments-layout")).toHaveClass(
      "flex-col",
      "lg:flex-row"
    );
    expect(screen.getByTestId("inline-threads").parentElement).toHaveClass(
      "min-w-0"
    );
  });

  it("shows a remote inline comment without a page refresh", async () => {
    vi.useFakeTimers();
    render(<BlockNoteEditor contentId="content-1" editable />);

    expect(screen.getByTestId("inline-threads")).toHaveTextContent("0");
    roomThreads.current = [{ id: "thread-1", resolved: false }];

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });

    expect(screen.getByTestId("inline-threads")).toHaveTextContent("1");
  });
});
