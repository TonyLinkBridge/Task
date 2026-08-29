"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import type { VerifiedUser } from "@/lib/auth/types";

export function TasksHeader({ currentUser }: { currentUser: VerifiedUser }) {
  return (
    <header className="flex h-[72px] min-w-0 items-center justify-between gap-2 border-b px-3 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <SidebarTrigger />
        <div className="min-w-0">
          <h1 className="truncate font-medium">任务</h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">建立、分派和跟进内部工作</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <Avatar className="size-8">
          {currentUser.imageUrl ? <AvatarImage src={currentUser.imageUrl} alt={currentUser.name} /> : null}
          <AvatarFallback>{currentUser.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
