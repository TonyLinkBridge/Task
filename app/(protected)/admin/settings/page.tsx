import { redirect } from "next/navigation";

import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { ContentHeader } from "@/components/app-shell/content-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  archivePlatform,
  createPlatform,
  restorePlatform,
  updatePlatform,
} from "@/features/admin/actions/platforms";
import { PlatformSettings } from "@/features/admin/components/platform-settings";
import { contentRepository } from "@/features/content/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

export default async function AdminSettingsPage() {
  const currentUser = await getVerifiedUser();
  if (currentUser.role !== "admin") {
    redirect("/access-denied");
  }

  const platforms = await contentRepository.listAllPlatforms();

  return (
    <SidebarProvider>
      <AppSidebar currentUser={currentUser} />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <ContentHeader
          currentUser={currentUser}
          title="管理员设置"
          description="管理发布平台、通知和成员"
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="mx-auto max-w-4xl space-y-5">
            <div>
              <h2 className="text-2xl font-semibold">系统设置</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                先管理发布平台；Slack 通知和成员设置会在同一个页面继续加入。
              </p>
            </div>
            <PlatformSettings
              initialPlatforms={platforms}
              createPlatformAction={createPlatform}
              updatePlatformAction={updatePlatform}
              archivePlatformAction={archivePlatform}
              restorePlatformAction={restorePlatform}
            />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
