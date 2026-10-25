import { redirect } from 'next/navigation';
import { legacyWorkspaceHref, type WorkspaceSearchParams } from '@/lib/navigation/workspace-href';

export default async function TasksPage({ searchParams }: { searchParams?: Promise<WorkspaceSearchParams> }) {
  redirect(legacyWorkspaceHref('/tasks', await searchParams));
}
