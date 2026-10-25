import { redirect } from 'next/navigation';
import { legacyWorkspaceHref, type WorkspaceSearchParams } from '@/lib/navigation/workspace-href';

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<WorkspaceSearchParams> }) {
  redirect(legacyWorkspaceHref('/dashboard', await searchParams));
}
