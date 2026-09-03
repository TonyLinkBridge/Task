"use client";

import { Logout03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useClerk } from "@clerk/nextjs";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { VerifiedUser } from "@/lib/auth/types";

export function UserAccountMenu({ currentUser }: { currentUser: VerifiedUser }) {
  const { signOut } = useClerk();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-full"
            aria-label="打开账号菜单"
          >
            <Avatar className="size-8">
              {currentUser.imageUrl ? (
                <AvatarImage src={currentUser.imageUrl} alt={currentUser.name} />
              ) : null}
              <AvatarFallback>{currentUser.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="space-y-0.5">
            <span className="block truncate text-sm font-medium text-foreground">
              {currentUser.name}
            </span>
            <span className="block font-normal">
              {currentUser.role === "admin" ? "管理员" : "员工"}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer"
          onClick={() => void signOut({ redirectUrl: "/login" })}
        >
          <HugeiconsIcon icon={Logout03Icon} />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
