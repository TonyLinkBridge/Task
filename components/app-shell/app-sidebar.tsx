"use client";

import { Calendar03Icon, DashboardSquare01Icon, Note01Icon, Settings02Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AdminOnly } from "@/components/auth/admin-only";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { VerifiedUser } from "@/lib/auth/types";

export function AppSidebar({ currentUser }: { currentUser: VerifiedUser }) {
  const pathname = usePathname();
  return (
    <Sidebar className="border-r">
      <SidebarHeader className="overflow-visible px-4 pb-4 pt-16">
        <div className="group/brand relative isolate rounded-lg">
          <Image
            src="/mascots/chiikawa-peek.png"
            alt=""
            aria-hidden="true"
            data-testid="sidebar-brand-mascot"
            width={384}
            height={384}
            priority
            draggable={false}
            className="pointer-events-none absolute left-1/2 top-0 z-0 size-[4.5rem] -translate-x-1/2 -translate-y-6 select-none object-contain transition-transform duration-300 ease-out group-hover/brand:-translate-y-[3.75rem] group-hover/brand:-rotate-3 group-hover/brand:scale-105 motion-reduce:transition-none"
          />
          <div className="relative z-10 flex items-center gap-2 rounded-lg bg-sidebar px-2 py-1.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">J</div>
            <div><p className="text-sm font-semibold">JUYU</p><p className="text-xs text-muted-foreground">内部工作台</p></div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel>工作</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem><SidebarMenuButton isActive={pathname.startsWith("/dashboard")} render={<Link href="/dashboard" />}><HugeiconsIcon icon={DashboardSquare01Icon} /><span>首页</span></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton isActive={pathname.startsWith("/tasks")} render={<Link href="/tasks" />}><HugeiconsIcon icon={Note01Icon} /><span>任务</span></SidebarMenuButton></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuButton isActive={pathname.startsWith("/content")} render={<Link href="/content" />}><HugeiconsIcon icon={Calendar03Icon} /><span>内容排期</span></SidebarMenuButton></SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <AdminOnly role={currentUser.role}>
          <SidebarGroup>
            <SidebarGroupLabel>管理员</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem><SidebarMenuButton isActive={pathname.startsWith("/admin/settings")} render={<Link href="/admin/settings" />}><HugeiconsIcon icon={Settings02Icon} /><span>管理员设置</span></SidebarMenuButton></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuButton isActive={pathname.startsWith("/admin/history")} render={<Link href="/admin/history" />}><HugeiconsIcon icon={Note01Icon} /><span>历史记录</span></SidebarMenuButton></SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </AdminOnly>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <Avatar className="size-8">{currentUser.imageUrl ? <AvatarImage src={currentUser.imageUrl} alt={currentUser.name} /> : null}<AvatarFallback><HugeiconsIcon icon={UserGroupIcon} /></AvatarFallback></Avatar>
          <div className="min-w-0"><p className="truncate text-sm font-medium">{currentUser.name}</p><p className="text-xs text-muted-foreground">{currentUser.role === "admin" ? "管理员" : "员工"}</p></div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
