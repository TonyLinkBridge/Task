import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/tasks",
}));

import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

describe("AppSidebar brand mascot", () => {
  it("shows a decorative Chiikawa mascot beside the JUYU brand", () => {
    render(
      <SidebarProvider>
        <AppSidebar
          currentUser={{
            id: "user-1",
            role: "employee",
            name: "Tony",
            imageUrl: null,
          }}
        />
      </SidebarProvider>
    );

    expect(screen.getByText("JUYU")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-brand-mascot")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
    expect(screen.getByTestId("sidebar-brand-mascot")).toHaveAttribute(
      "src",
      expect.stringContaining("chiikawa-peek.png")
    );
  });
});
