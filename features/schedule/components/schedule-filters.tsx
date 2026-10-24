import { Select } from "@/components/ui/select";
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
      <Select label="平台" name="platform" defaultValue={filters.platformId??""} options={[{value:"",label:"全部平台"},...platforms.map(p=>({value:p.id,label:p.name}))]} />
      <Select label="负责人" name="assignee" defaultValue={filters.assigneeId??""} options={[{value:"",label:"所有人"},...assignees.map(a=>({value:a.id,label:a.name}))]} />
      <Select label="状态" name="status" defaultValue={filters.status??""} options={[{value:"",label:"全部状态"},{value:"draft",label:"草稿"},{value:"in_review",label:"等待审核"},{value:"changes_requested",label:"需要修改"},{value:"approved",label:"已经批准"},{value:"due",label:"等待发布"},{value:"published",label:"已经发布"}]} />
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
