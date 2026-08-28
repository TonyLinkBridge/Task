import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "@/app/page";

describe("home page", () => {
  it("shows the internal tool name", () => {
    render(<HomePage />);

    expect(screen.getByText("内部工作台")).toBeInTheDocument();
  });
});
