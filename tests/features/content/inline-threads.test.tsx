import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@liveblocks/react-blocknote", () => ({
  AnchoredThreads: ({ threads }: { threads: Array<{ resolved: boolean }> }) => (
    <div>
      {threads.map((thread, index) => (
        <span key={index}>{thread.resolved ? "已解决留言" : "未解决留言"}</span>
      ))}
    </div>
  ),
  FloatingThreads: ({ threads }: { threads: Array<{ resolved: boolean }> }) => (
    <div>
      {threads.map((thread, index) => (
        <span key={index}>{thread.resolved ? "手机已解决留言" : "手机未解决留言"}</span>
      ))}
    </div>
  ),
}));

vi.mock("@liveblocks/react-ui", () => ({
  Thread: ({ thread }: { thread: { resolved: boolean } }) => (
    <article>
      <span>{thread.resolved ? "已解决留言卡片" : "未解决留言卡片"}</span>
      {thread.resolved ? <button>Re-open thread</button> : null}
    </article>
  ),
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

  it("lets a user switch from open threads to resolved threads", async () => {
    const user = userEvent.setup();
    setDesktopViewport(true);
    render(
      <InlineThreads
        editor={{} as never}
        threads={[
          { id: "open", resolved: false },
          { id: "resolved", resolved: true },
        ] as never}
      />
    );

    expect(screen.getByRole("button", { name: "未解决 1" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByText("未解决留言")).toBeInTheDocument();
    expect(screen.queryByText("已解决留言")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "已解决 1" }));

    expect(screen.getByRole("button", { name: "已解决 1" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByText("已解决留言卡片")).toBeInTheDocument();
    expect(screen.queryByText("未解决留言")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Re-open thread" })
    ).toBeInTheDocument();
  });
});
