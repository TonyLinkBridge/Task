import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
  useCreateBlockNoteWithLiveblocks: () => ({ document: [] }),
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
