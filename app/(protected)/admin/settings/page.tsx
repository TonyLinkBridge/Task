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
import { saveNotificationSettings } from "@/features/admin/actions/notification-settings";
import { MemberList } from "@/features/admin/components/member-list";
import { PlatformSettings } from "@/features/admin/components/platform-settings";
import { SlackSettingsForm } from "@/features/admin/components/slack-settings-form";
import { adminRepository } from "@/features/admin/repository";
import { contentRepository } from "@/features/content/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";
import { getServerEnv } from "@/lib/env/server";
import { makeSlackClient } from "@/lib/slack/client";

export default async function AdminSettingsPage() {
  const currentUser = await getVerifiedUser();
  if (currentUser.role !== "admin") {
    redirect("/access-denied?reason=admin-only");
  }

  const token = getServerEnv().SLACK_BOT_TOKEN;
  const [platforms, settings, members, channels] = await Promise.all([
    contentRepository.listAllPlatforms(),
    adminRepository.getNotificationSettings(),
    adminRepository.listMembers(),
    token
      ? makeSlackClient({ token }).listAllowedChannels().catch(() => [])
      : Promise.resolve([]),
  ]);

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
                管理发布平台、Slack 频道提醒和系统成员。
              </p>
            </div>
            <PlatformSettings
              initialPlatforms={platforms}
              createPlatformAction={createPlatform}
              updatePlatformAction={updatePlatform}
              archivePlatformAction={archivePlatform}
              restorePlatformAction={restorePlatform}
            />
            <SlackSettingsForm
              configured={Boolean(token)}
              channels={channels}
              initialSettings={settings}
              saveSettingsAction={saveNotificationSettings}
            />
            <MemberList members={members} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
