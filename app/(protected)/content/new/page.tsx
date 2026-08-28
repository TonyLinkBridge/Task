import Link from "next/link";

import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { ContentHeader } from "@/components/app-shell/content-header";
import { buttonVariants } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { createScheduledContent } from "@/features/content/actions/content";
import { ContentFormPage } from "@/features/content/components/content-form-page";
import { contentRepository } from "@/features/content/repository";
import { taskRepository } from "@/features/tasks/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

export default async function NewContentPage() {
  const [currentUser, platforms, assignees] = await Promise.all([
    getVerifiedUser(),
    contentRepository.listPlatforms(),
    taskRepository.listAssignees(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar currentUser={currentUser} />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <ContentHeader currentUser={currentUser} />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="mx-auto max-w-3xl space-y-5">
            <Link href="/content" className={buttonVariants({ variant: "ghost" })}>
              ← 返回内容排期
            </Link>
            <div>
              <h2 className="text-2xl font-semibold">建立排期内容</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                先填写排期资料，建立后再写正文和上传文件。
              </p>
            </div>
            <ContentFormPage
              platforms={platforms}
              assignees={assignees}
              createContentAction={createScheduledContent}
            />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
