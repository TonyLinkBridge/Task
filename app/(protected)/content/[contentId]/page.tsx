import { redirect } from 'next/navigation';
import { legacyWorkspaceHref, type WorkspaceSearchParams } from '@/lib/navigation/workspace-href';

export default async function ContentDetailPage({ params, searchParams }: {
  params: Promise<{ contentId: string }>; searchParams?: Promise<WorkspaceSearchParams>;
}) {
  const { contentId } = await params;
  redirect(legacyWorkspaceHref(`/content/${encodeURIComponent(contentId)}`, await searchParams));
}
