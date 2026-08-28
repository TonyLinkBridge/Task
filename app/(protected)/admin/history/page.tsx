import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { ContentHeader } from "@/components/app-shell/content-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { retrySlackDelivery } from "@/features/admin/actions/retry-slack-delivery";
import { AuditLog } from "@/features/admin/components/audit-log";
import { DeliveryLog } from "@/features/admin/components/delivery-log";
import { adminRepository } from "@/features/admin/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

export default async function AdminHistoryPage() {
  const currentUser = await getVerifiedUser();
  if (currentUser.role !== "admin") redirect("/access-denied");

  const [deliveries, auditEvents] = await Promise.all([
    adminRepository.listSlackDeliveries(),
    adminRepository.listAuditEvents(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar currentUser={currentUser} />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <ContentHeader
          currentUser={currentUser}
          title="历史记录"
          description="查看重要操作和 Slack 发送情况"
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="mx-auto max-w-5xl space-y-5">
            <div>
              <h1 className="text-2xl font-semibold">系统历史</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                所有时间都使用马来西亚时间；发送失败时可以在这里重新排队。
              </p>
            </div>
            <DeliveryLog deliveries={deliveries} retryAction={retrySlackDelivery} />
            <AuditLog events={auditEvents} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
