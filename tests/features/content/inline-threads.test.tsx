import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@liveblocks/react-blocknote", () => ({
  AnchoredThreads: () => <div>会挤压正文的留言栏</div>,
  FloatingThreads: () => <div>浮动留言</div>,
}));

import { InlineThreads } from "@/features/content/components/inline-threads";

describe("InlineThreads", () => {
  it("uses floating threads without rendering a desktop column that narrows the editor", () => {
    render(
      <InlineThreads
        editor={{} as never}
        threads={[]}
      />
    );

    expect(screen.getByTestId("floating-threads")).toBeInTheDocument();
    expect(screen.getByText("浮动留言")).toBeInTheDocument();
    expect(screen.queryByText("会挤压正文的留言栏")).not.toBeInTheDocument();
  });
});
