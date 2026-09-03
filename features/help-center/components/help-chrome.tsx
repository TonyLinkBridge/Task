"use client";

import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { VerifiedUser } from "@/lib/auth/types";

import { HelpHeader } from "./help-header";

export function HelpChrome({
  currentUser,
  children,
}: {
  currentUser: VerifiedUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPdfPage = pathname.endsWith("/pdf");

  if (isPdfPage) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <SidebarProvider>
      <AppSidebar currentUser={currentUser} />
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <HelpHeader currentUser={currentUser} />
        <main className="min-w-0 flex-1 overflow-auto">{children}</main>
      </div>
    </SidebarProvider>
  );
}
