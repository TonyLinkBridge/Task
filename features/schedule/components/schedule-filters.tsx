import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import type { ContentPlatform } from "@/features/content/types";
import type { ScheduleFilters } from "@/features/schedule/types";
import type { AssignableUser } from "@/features/tasks/types";
import { cn } from "@/lib/utils";

export function ScheduleFiltersBar({
  filters,
  platforms,
  assignees,
}: {
  filters: ScheduleFilters;
  platforms: ContentPlatform[];
  assignees: AssignableUser[];
}) {
  return (
    <form action="/content" className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-5">
      <label className="grid gap-1.5 text-xs text-muted-foreground">
        平台
        <select name="platform" defaultValue={filters.platformId ?? ""} className="h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground">
          <option value="">全部平台</option>
          {platforms.map((platform) => <option key={platform.id} value={platform.id}>{platform.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1.5 text-xs text-muted-foreground">
        负责人
        <select name="assignee" defaultValue={filters.assigneeId ?? ""} className="h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground">
          <option value="">所有人</option>
          {assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.name}</option>)}
        </select>
      </label>
      <label className="grid gap-1.5 text-xs text-muted-foreground">
        状态
        <select name="status" defaultValue={filters.status ?? ""} className="h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground">
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="in_review">等待审核</option>
          <option value="changes_requested">需要修改</option>
          <option value="approved">已经批准</option>
          <option value="due">等待发布</option>
          <option value="published">已经发布</option>
        </select>
      </label>
      <label className="grid gap-1.5 text-xs text-muted-foreground">
        从哪一天
        <input name="from" type="date" defaultValue={filters.from} className="h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground" />
      </label>
      <label className="grid gap-1.5 text-xs text-muted-foreground">
        到哪一天
        <input name="to" type="date" defaultValue={filters.to} className="h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground" />
      </label>
      <div className="flex gap-2 md:col-span-5 md:justify-end">
        <Link href="/content" className={cn(buttonVariants({ variant: "ghost" }), "h-9")}>清除</Link>
        <Button type="submit" variant="outline">筛选</Button>
      </div>
    </form>
  );
}
