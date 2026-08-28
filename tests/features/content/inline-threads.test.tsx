import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@liveblocks/react-blocknote", () => ({
  AnchoredThreads: () => <div>电脑留言</div>,
  FloatingThreads: () => <div>手机留言</div>,
}));

import { InlineThreads } from "@/features/content/components/inline-threads";

describe("InlineThreads", () => {
  it("shows anchored threads on desktop and floating threads on mobile", () => {
    render(
      <InlineThreads
        editor={{} as never}
        threads={[]}
      />
    );

    expect(screen.getByTestId("anchored-threads")).toBeInTheDocument();
    expect(screen.getByTestId("floating-threads")).toBeInTheDocument();
  });
});
