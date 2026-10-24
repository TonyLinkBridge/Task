'use client';
import { useEffect, useRef } from 'react';
import { useSelf, useEventListener } from '@liveblocks/react';
import { useRouter } from 'next/navigation';

export function MarketingRoomPermissionSync({ editable, children }: { editable: boolean; children: React.ReactNode }) {
  const canWrite = useSelf(self => self.canWrite);
  const router = useRouter();
  // Events only invalidate the local view. The server still decides status and permissions.
  useEventListener(() => router.refresh());
  const lastMismatch = useRef<string | null>(null);
  const stale = canWrite !== null && canWrite !== editable;

  useEffect(() => {
    if (!stale) { lastMismatch.current = null; return; }
    const mismatch = `${editable}:${canWrite}`;
    if (lastMismatch.current !== mismatch) {
      lastMismatch.current = mismatch;
      router.refresh();
    }
  }, [canWrite, editable, router, stale]);

  return <>
    {stale ? <p role="status" className="mb-3 text-sm text-muted-foreground">正在更新审核状态…</p> : null}
    <div inert={stale || undefined}>{children}</div>
  </>;
}
