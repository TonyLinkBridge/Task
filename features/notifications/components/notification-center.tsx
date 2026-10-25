"use client";

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NotificationCenter as ArcNotificationCenter, type NotificationItem } from '@/components/arc/notification-center/notification-center';
import type { InAppNotification, NotificationMutation } from '../in-app-types';
import { announceNotificationChange, onNotificationChange, onNotificationsRead } from '../read-state-events';
import styles from './notification-theme.module.css';

const dateFormat = new Intl.DateTimeFormat('zh-MY', {
  timeZone: 'Asia/Kuala_Lumpur', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
});
function toItem(item: InAppNotification): NotificationItem {
  const date = new Date(item.createdAt);
  return { id: item.id, title: item.title, description: item.body,
    read: Boolean(item.readAt), time: Number.isFinite(date.getTime()) ? dateFormat.format(date) : '时间未知' };
}

export function NotificationCenter({ mapHref = (href) => href }: { mapHref?: (href: string) => string }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const records = useRef(new Map<string, InAppNotification>());
  const pending = useRef(false);
  const request = useRef<AbortController | null>(null);
  const sequence = useRef(0);

  const load = useCallback(async () => {
    if (pending.current) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const current = ++sequence.current;
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw Error('LOAD_FAILED');
      const data = await response.json();
      if (!Array.isArray(data.notifications)) throw Error('INVALID_RESPONSE');
      if (current !== sequence.current || controller.signal.aborted) return;
      const notifications: InAppNotification[] = data.notifications;
      records.current = new Map(notifications.map(item => [item.id, item]));
      setItems(notifications.filter(item => !item.dismissedAt).map(toItem));
      setError(null);
    } catch {
      if (current === sequence.current && !controller.signal.aborted) setError('通知暂时加载失败，请重试。');
    } finally {
      if (current === sequence.current && !controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void load(); });
    const refresh = () => { if (document.visibilityState === 'visible') void load(); };
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    return () => { active = false; request.current?.abort(); window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [load]);
  useEffect(() => onNotificationsRead(() => setItems(current => current.map(item => ({ ...item, read: true })))), []);
  useEffect(() => onNotificationChange(change => {
    const ids = new Set(change.ids);
    setItems(current => change.action === 'dismiss' ? current.filter(item => !ids.has(item.id))
      : current.map(item => ids.has(item.id) ? { ...item, read: change.action === 'read' } : item));
  }), []);

  async function save(action: NotificationMutation, selected: NotificationItem[]) {
    if (pending.current || !selected.length) return;
    pending.current = true;
    request.current?.abort();
    sequence.current++;
    const before = items;
    const ids = selected.map(item => item.id);
    setBusy(true); setError(null);
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ids }),
      });
      if (!response.ok) throw Error('SAVE_FAILED');
      announceNotificationChange({ action, ids, readAt: action === 'read' ? new Date().toISOString() : null });
    } catch {
      setItems([...before]);
      setError('刚才的操作没有保存，已恢复原状。请再试一次。');
    } finally { pending.current = false; setBusy(false); }
  }

  return <ArcNotificationCenter
    notifications={[]} value={items} onValueChange={setItems} label="通知中心" className={styles.theme} busy={busy}
    open={open} onOpenChange={next => { setOpen(next); if (next) void load(); }}
    onReadChange={(item, read) => void save(read ? 'read' : 'unread', [item])}
    onDismiss={item => void save('dismiss', [item])}
    onMarkAllRead={selected => void save('read', selected)}
    onClearRead={selected => void save('dismiss', selected)}
    status={error ? <div role="alert"><p>{error}</p><button type="button" disabled={busy} onClick={() => void load()}>重新加载通知</button></div>
      : loading ? <p role="status">正在读取通知…</p> : busy ? <p role="status">正在保存…</p> : undefined}
    renderAction={item => {
      const href = records.current.get(item.id)?.href;
      return href?.startsWith('/') && !href.startsWith('//')
        ? <Link href={mapHref(href)} onClick={() => setOpen(false)}>打开详情</Link> : null;
    }}
    footer={<p>显示最近 30 条通知。移除只收起铃铛通知，记录仍保留在<Link href={mapHref('/inbox')} onClick={() => setOpen(false)}>收件箱</Link>。</p>}
  />;
}
