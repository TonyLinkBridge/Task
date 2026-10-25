import { redirect } from 'next/navigation';
import { legacyWorkspaceHref, type WorkspaceSearchParams } from '@/lib/navigation/workspace-href';

export default async function NewContentPage({ searchParams }: { searchParams?: Promise<WorkspaceSearchParams> } = {}) {
  redirect(legacyWorkspaceHref('/content/new', await searchParams));
}
