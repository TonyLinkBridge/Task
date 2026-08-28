import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { TasksHeader } from "@/components/tasks/header/tasks-header";
import { TasksMain } from "@/components/tasks/tasks-main";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function TasksPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        <TasksHeader />
        <main className="flex-1 overflow-auto">
          <TasksMain />
        </main>
      </div>
    </SidebarProvider>
  );
}
