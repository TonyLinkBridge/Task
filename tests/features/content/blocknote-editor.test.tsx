import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { blockNoteOptions } = vi.hoisted(() => ({
  blockNoteOptions: {
    current: null as null | Record<string, unknown>,
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
  useThreads: () => ({ threads: [] }),
}));

vi.mock("@/features/content/components/inline-threads", () => ({
  InlineThreads: () => <div data-testid="inline-threads" />,
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
});
