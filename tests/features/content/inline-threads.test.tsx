import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@liveblocks/react-blocknote", () => ({
  AnchoredThreads: () => <div>电脑留言</div>,
  FloatingThreads: () => <div>手机留言</div>,
}));

import { InlineThreads } from "@/features/content/components/inline-threads";

function setDesktopViewport(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: "(min-width: 1024px)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("InlineThreads", () => {
  it("only mounts anchored threads on desktop", () => {
    setDesktopViewport(true);
    render(
      <InlineThreads
        editor={{} as never}
        threads={[]}
      />
    );

    expect(screen.getByTestId("anchored-threads")).toBeInTheDocument();
    expect(screen.queryByTestId("floating-threads")).not.toBeInTheDocument();
  });

  it("only mounts floating threads on mobile", () => {
    setDesktopViewport(false);
    render(
      <InlineThreads
        editor={{} as never}
        threads={[]}
      />
    );

    expect(screen.queryByTestId("anchored-threads")).not.toBeInTheDocument();
    expect(screen.getByTestId("floating-threads")).toBeInTheDocument();
  });
});
