import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GlobalSearch } from "@/features/search/components/global-search";

afterEach(() => vi.unstubAllGlobals());

describe("GlobalSearch", () => {
  it("opens with the Command-K keyboard shortcut", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<GlobalSearch />);

    fireEvent.keyDown(window, { key: "k", metaKey: true });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("搜索任务、内容和帮助文章")).toBeInTheDocument();
  });
});
