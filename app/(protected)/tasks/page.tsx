import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { TasksHeader } from "@/components/tasks/header/tasks-header";
import { TasksMain } from "@/components/tasks/tasks-main";
import { SidebarProvider } from "@/components/ui/sidebar";
import { createTask, moveTask, updateTask } from "@/features/tasks/actions";
import { getTaskBoardData } from "@/features/tasks/queries";
import { taskFiltersFromSearchParams } from "@/features/tasks/schema";

type TasksPageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const filters = taskFiltersFromSearchParams(await searchParams);
  const { currentUser, tasks, assignees } = await getTaskBoardData(filters);

  return (
    <SidebarProvider>
      <AppSidebar currentUser={currentUser} />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <TasksHeader currentUser={currentUser} />
        <main className="flex-1 overflow-auto">
          <TasksMain tasks={tasks} assignees={assignees} filters={filters} createTaskAction={createTask} updateTaskAction={updateTask} moveTaskAction={moveTask} />
        </main>
      </div>
    </SidebarProvider>
  );
}
