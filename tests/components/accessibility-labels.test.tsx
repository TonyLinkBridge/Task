import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { signOutMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}));

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ signOut: signOutMock }),
}));

import { ThemeToggle } from "@/components/theme-toggle";
import { ContentHeader } from "@/components/app-shell/content-header";
import { TasksHeader } from "@/components/tasks/header/tasks-header";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

describe("Chinese accessibility labels", () => {
  it("gives icon-only global controls Chinese names", () => {
    render(
      <SidebarProvider>
        <SidebarTrigger />
        <ThemeToggle />
      </SidebarProvider>
    );

    expect(
      screen.getByRole("button", { name: "打开或关闭侧栏" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "切换显示模式" })
    ).toBeInTheDocument();
  });

  it("gives dialog and side panel close controls Chinese names", () => {
    const dialog = render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>测试对话框</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByRole("button", { name: "关闭" })).toBeInTheDocument();
    dialog.unmount();

    render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>测试侧边面板</SheetTitle>
        </SheetContent>
      </Sheet>
    );
    expect(screen.getByRole("button", { name: "关闭" })).toBeInTheDocument();
  });

  it("keeps the page heading from colliding with controls on a phone", () => {
    render(
      <SidebarProvider>
        <ContentHeader
          currentUser={{
            id: "employee-1",
            role: "employee",
            name: "Tony",
            imageUrl: null,
          }}
          title="很长的页面名称"
          description="很长的页面说明"
        />
      </SidebarProvider>
    );

    expect(screen.getByRole("heading", { name: "很长的页面名称" })).toHaveClass(
      "truncate"
    );
    expect(screen.getByText("很长的页面说明")).toHaveClass("hidden", "sm:block");
  });

  it("uses the same phone-safe heading layout on the task pages", () => {
    render(
      <SidebarProvider>
        <TasksHeader
          currentUser={{
            id: "employee-1",
            role: "employee",
            name: "Tony",
            imageUrl: null,
          }}
        />
      </SidebarProvider>
    );

    expect(screen.getByRole("heading", { name: "任务" })).toHaveClass("truncate");
    expect(screen.getByText("建立、分派和跟进内部工作")).toHaveClass(
      "hidden",
      "sm:block"
    );
  });

  it("opens the account menu from the avatar and signs out to the login page", async () => {
    const user = userEvent.setup();

    render(
      <SidebarProvider>
        <ContentHeader
          currentUser={{
            id: "employee-1",
            role: "employee",
            name: "Tony",
            imageUrl: null,
          }}
        />
      </SidebarProvider>
    );

    fireEvent.mouseDown(screen.getByRole("button", { name: "打开账号菜单" }));
    await user.click(await screen.findByRole("menuitem", { name: "退出登录" }));

    expect(signOutMock).toHaveBeenCalledWith({ redirectUrl: "/login" });
  });
});
