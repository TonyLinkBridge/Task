import { redirect } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

import HomePage from "@/app/page";

describe("home page", () => {
  it("sends users to the tasks page", () => {
    expect(() => HomePage()).toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith("/tasks");
  });
});
