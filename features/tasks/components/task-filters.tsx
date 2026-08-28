import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AssignableUser, TaskFilters } from "@/features/tasks/types";
import { cn } from "@/lib/utils";

export function TaskFiltersBar({
  filters,
  assignees,
}: {
  filters: TaskFilters;
  assignees: AssignableUser[];
}) {
  return (
    <form action="/tasks" className="flex flex-wrap items-end gap-3 px-4 sm:px-6">
      <label className="grid min-w-56 flex-1 gap-1.5 text-xs text-muted-foreground">
        搜索任务
        <Input name="search" type="search" defaultValue={filters.search} placeholder="输入任务标题" />
      </label>
      <label className="grid gap-1.5 text-xs text-muted-foreground">
        优先级
        <select name="priority" defaultValue={filters.priority ?? ""} className="h-9 min-w-28 rounded-md border border-input bg-background px-2.5 text-sm text-foreground">
          <option value="">全部</option>
          <option value="urgent">紧急</option>
          <option value="medium">重要</option>
          <option value="low">普通</option>
        </select>
      </label>
      <label className="grid gap-1.5 text-xs text-muted-foreground">
        负责人
        <select name="assignee" defaultValue={filters.assigneeId ?? ""} className="h-9 min-w-36 rounded-md border border-input bg-background px-2.5 text-sm text-foreground">
          <option value="">所有人</option>
          {assignees.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>{assignee.name}</option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="outline">筛选</Button>
      <Link href="/tasks" className={cn(buttonVariants({ variant: "ghost" }), "h-9")}>清除</Link>
    </form>
  );
}
