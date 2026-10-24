import { Select } from "@/components/ui/select";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AssignableUser, TaskFilters } from "@/features/tasks/types";
import type { TaskRecord } from "@/features/tasks/types";
import { cn } from "@/lib/utils";
import { ImportExportDropdown } from "@/components/tasks/filters/import-export-dropdown";

export function TaskFiltersBar({
  filters,
  assignees,
  tasks,
  createTaskAction,
  basePath = '/tasks',
}: {
  filters: TaskFilters;
  assignees: AssignableUser[];
  tasks: TaskRecord[];
  basePath?: '/tasks' | '/marketing/tasks';
  createTaskAction: (input: unknown) => Promise<
    { ok: true; data: TaskRecord } | { ok: false; message: string }
  >;
}) {
  return (
    <form action={basePath} className="flex flex-wrap items-end gap-3 px-4 sm:px-6">
      <label className="grid min-w-56 flex-1 gap-1.5 text-xs text-muted-foreground">
        搜索任务
        <Input name="search" type="search" defaultValue={filters.search} placeholder="输入任务标题" />
      </label>
      <label className="grid gap-1.5 text-xs text-muted-foreground">
        项目／分类
        <Input name="project" defaultValue={filters.project ?? ""} placeholder="例如：内容运营" className="min-w-36" />
      </label>
      <Select label="优先级" name="priority" defaultValue={filters.priority??""} options={[{value:"",label:"全部"},{value:"urgent",label:"紧急"},{value:"medium",label:"重要"},{value:"low",label:"普通"}]} className="min-w-28" />
      <Select label="负责人" name="assignee" defaultValue={filters.assigneeId??""} options={[{value:"",label:"所有人"},...assignees.map(a=>({value:a.id,label:a.name}))]} className="min-w-36" />
      <Button type="submit" variant="outline">筛选</Button>
      <Link href={basePath} className={cn(buttonVariants({ variant: "ghost" }), "h-9")}>清除</Link>
      <ImportExportDropdown tasks={tasks} assignees={assignees} createTaskAction={createTaskAction} />
    </form>
  );
}
