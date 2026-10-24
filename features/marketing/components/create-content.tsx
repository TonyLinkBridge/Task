'use client';
import { useRouter } from 'next/navigation';
import { ContentForm } from '@/features/content/components/content-form';
import type { ContentPlatform } from '@/features/content/types';
import type { AssignableUser } from '@/features/tasks/types';
import type { ContentActionResult } from '@/features/content/action-service';

export function MarketingCreateContent({ platforms, assignees, createAction }: {
  platforms: ContentPlatform[]; assignees: AssignableUser[];
  createAction(input: unknown): Promise<ContentActionResult>;
}) {
  const router = useRouter();
  return <ContentForm platforms={platforms} assignees={assignees} saveContentAction={createAction}
    onSaved={content => router.push(`/marketing/content/${encodeURIComponent(content.id)}`)} />;
}
