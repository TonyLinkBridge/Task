import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const markThreadAsUnresolved = vi.hoisted(() => vi.fn());

vi.mock("@liveblocks/react/suspense", () => ({
  useMarkThreadAsUnresolved: () => markThreadAsUnresolved,
}));

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
  Thread: ({
    thread,
    onClick,
  }: {
    thread: { id: string; resolved: boolean };
    onClick?: () => void;
  }) => (
    <article aria-label={`留言 ${thread.id}`} onClick={onClick}>
      <span>{thread.resolved ? "已解决留言卡片" : "未解决留言卡片"}</span>
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
    markThreadAsUnresolved.mockClear();
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
    expect(screen.getByText("未解决留言卡片")).toBeInTheDocument();
    expect(screen.queryByText("已解决留言卡片")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "已解决 1" }));

    expect(screen.getByRole("button", { name: "已解决 1" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByText("已解决留言卡片")).toBeInTheDocument();
    expect(screen.queryByText("未解决留言卡片")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "重新打开" }));

    expect(markThreadAsUnresolved).toHaveBeenCalledWith("resolved");
  });

  it("shows open threads as cards and selects their original text when clicked", async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    const originalText = document.createElement("span");
    originalText.dataset.lbThreadId = "open-a";
    originalText.scrollIntoView = scrollIntoView;
    document.body.appendChild(originalText);
    setDesktopViewport(true);
    render(
      <InlineThreads
        editor={{} as never}
        threads={[
          { id: "open-a", resolved: false },
          { id: "open-b", resolved: false },
        ] as never}
      />
    );

    expect(screen.getAllByText("未解决留言卡片")).toHaveLength(2);

    await user.click(screen.getByRole("article", { name: "留言 open-a" }));

    expect(scrollIntoView).toHaveBeenCalledOnce();

    originalText.remove();
  });

  it("only lets an admin clear resolved threads after confirming", async () => {
    const user = userEvent.setup();
    const onClearResolved = vi.fn().mockResolvedValue({
      ok: true,
      deleted: 1,
    });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    setDesktopViewport(true);
    const { rerender } = render(
      <InlineThreads
        canClearResolved={false}
        editor={{} as never}
        onClearResolved={onClearResolved}
        threads={[{ id: "resolved", resolved: true }] as never}
      />
    );

    await user.click(screen.getByRole("button", { name: "已解决 1" }));
    expect(
      screen.queryByRole("button", { name: "清空已解决" })
    ).not.toBeInTheDocument();

    rerender(
      <InlineThreads
        canClearResolved
        editor={{} as never}
        onClearResolved={onClearResolved}
        threads={[{ id: "resolved", resolved: true }] as never}
      />
    );
    await user.click(screen.getByRole("button", { name: "清空已解决" }));
    expect(onClearResolved).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    await user.click(screen.getByRole("button", { name: "清空已解决" }));
    expect(onClearResolved).toHaveBeenCalledOnce();

    confirm.mockRestore();
  });
});
