import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { HelpHeader } from "@/features/help-center/components/help-header";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

export default async function HelpCenterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await getVerifiedUser();

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
