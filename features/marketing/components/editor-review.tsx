'use client';
import { useBroadcastEvent } from '@liveblocks/react';
import { ContentEditorReview } from '@/features/content/components/content-editor-review';

export function MarketingEditorReview(props: Omit<React.ComponentProps<typeof ContentEditorReview>, 'onReviewCompleted'>) {
  const broadcast = useBroadcastEvent();
  return <ContentEditorReview {...props} onReviewCompleted={() => broadcast({})} />;
}
