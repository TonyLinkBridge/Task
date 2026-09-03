import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

vi.mock("@blocknote/mantine", () => ({
  BlockNoteView: ({ theme }: { theme?: string }) => (
    <div data-testid="snapshot-blocknote" data-theme={theme ?? "unset"} />
  ),
}));

vi.mock("@blocknote/react", () => ({
  useCreateBlockNote: () => ({ document: [] }),
}));

import { SnapshotViewer } from "@/features/content/components/snapshot-viewer";

describe("SnapshotViewer", () => {
  it("uses the page's light theme for saved content", () => {
    render(<SnapshotViewer document={[]} />);

    expect(screen.getByTestId("snapshot-blocknote")).toHaveAttribute(
      "data-theme",
      "light"
    );
  });
});
