"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
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
    <header className="flex h-[72px] items-center justify-between border-b px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div>
          <h1 className="font-medium">{title}</h1>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Avatar className="size-8">
          {currentUser.imageUrl ? (
            <AvatarImage src={currentUser.imageUrl} alt={currentUser.name} />
          ) : null}
          <AvatarFallback>{currentUser.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
