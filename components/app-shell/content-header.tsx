"use client";

import { UserAccountMenu } from "@/components/auth/user-account-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationCenter } from "@/features/notifications/components/notification-center";
import type { VerifiedUser } from "@/lib/auth/types";

export function ContentHeader({
  currentUser,
  title = "内容排期",
  description = "准备、检查和安排发布内容",
}: {
  currentUser: VerifiedUser;
  title?: string;
  description?: string;
}) {
  return (
    <header className="flex h-[72px] min-w-0 items-center justify-between gap-2 border-b px-3 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <SidebarTrigger />
        <div className="min-w-0">
          <h1 className="truncate font-medium">{title}</h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">{description}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <NotificationCenter />
        <ThemeToggle />
        <UserAccountMenu currentUser={currentUser} />
      </div>
    </header>
  );
}
