import { MarketingShell } from '@/features/marketing/components/shell';
import { TasksMain } from '@/components/tasks/tasks-main';
import { getTaskBoardData } from '@/features/tasks/queries';
import { createTask, updateTask, moveTask } from '@/features/tasks/actions';
import { taskFiltersFromSearchParams } from '@/features/tasks/schema';
export default async function MarketingTasksPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = taskFiltersFromSearchParams(await searchParams);
  const { currentUser, tasks, assignees } = await getTaskBoardData(filters);
  return <MarketingShell currentUser={currentUser} active="tasks" title="Tasks" description="查看任务进度，分派工作并跟进完成。"><section className="marketing-entry marketing-tasks"><TasksMain tasks={tasks} assignees={assignees} filters={filters} createTaskAction={createTask} updateTaskAction={updateTask} moveTaskAction={moveTask} basePath="/marketing/tasks" /></section></MarketingShell>;
}
