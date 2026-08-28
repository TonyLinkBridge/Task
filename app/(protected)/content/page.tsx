import Link from "next/link";

import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { ContentHeader } from "@/components/app-shell/content-header";
import { buttonVariants } from "@/components/ui/button";
import { SidebarProvider } from "@/components/ui/sidebar";
import { contentRepository } from "@/features/content/repository";
import { moveEditableContent } from "@/features/schedule/actions";
import { ScheduleFiltersBar } from "@/features/schedule/components/schedule-filters";
import { ScheduleTabs } from "@/features/schedule/components/schedule-tabs";
import {
  listScheduledContent,
  scheduleFiltersFromSearchParams,
} from "@/features/schedule/queries";
import { taskRepository } from "@/features/tasks/repository";
import { getVerifiedUser } from "@/lib/auth/get-verified-user";

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = scheduleFiltersFromSearchParams(await searchParams);
  const [currentUser, contents, platforms, assignees] = await Promise.all([
    getVerifiedUser(),
    listScheduledContent(filters),
    contentRepository.listPlatforms(),
    taskRepository.listAssignees(),
  ]);

  return (
    <SidebarProvider>
      <AppSidebar currentUser={currentUser} />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <ContentHeader currentUser={currentUser} />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="mx-auto max-w-[1500px] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">内容排期</h2>
                <p className="mt-1 text-sm text-muted-foreground">同一批内容可以用日历、清单或看板查看。</p>
              </div>
              <Link href="/content/new" className={buttonVariants()}>建立内容</Link>
            </div>
            <ScheduleFiltersBar filters={filters} platforms={platforms} assignees={assignees} />
            <ScheduleTabs contents={contents} moveAction={moveEditableContent} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
