import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EditorSyncStatus } from "@/features/content/components/blocknote-editor";

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
