'use client';
import Link from 'next/link';
import { MarketingIcon } from './icon';
import { useEffect, useState } from 'react';
import { announceNotificationsRead, onNotificationsRead, onNotificationChange } from '@/features/notifications/read-state-events';
import type { InAppNotification } from '@/features/notifications/in-app-types';
import { marketingHref } from '../page-model';
import { malaysiaDateTimeFormatter } from '@/features/schedule/date';
export function MarketingInbox({ initialNotifications }: { initialNotifications: InAppNotification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unread = notifications.filter(item => !item.readAt).length;
  useEffect(() => onNotificationsRead(readAt => setNotifications(items => items.map(item => ({ ...item, readAt: item.readAt ?? readAt })))), []);
  useEffect(() => onNotificationChange(change => {
    if (change.action === 'dismiss') return; // Bell dismissal preserves the inbox record.
    const ids = new Set(change.ids);
    setNotifications(items => items.map(item => ids.has(item.id) ? { ...item, readAt: change.readAt } : item));
  }), []);
  async function markRead() {
    setBusy(true); setError(null);
    try {
      const response = await fetch('/api/notifications', { method: 'PATCH' });
      if (!response.ok) throw Error('SAVE_FAILED');
      announceNotificationsRead(new Date().toISOString());
    } catch { setError('暂时没有保存成功，请再试一次。'); } finally { setBusy(false); }
  }
  const visible = notifications.filter(item => !unreadOnly || !item.readAt);
  return <section className="marketing-card marketing-entry"><div className="marketing-toolbar"><div className="marketing-segments"><button aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)}>全部通知</button><button aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)}>未读 {unread}</button></div><button className="marketing-primary" disabled={busy || unread === 0} onClick={() => void markRead()}>{busy ? '正在保存…' : '全部设为已读'}</button></div>
    {error ? <p role="alert">{error}</p> : null}<div className="marketing-notification-list">{visible.map(item => <Link href={marketingHref(item.href)} key={item.id} className={item.readAt ? 'is-read' : ''}><h2>{item.title}{!item.readAt ? <span className="marketing-unread-dot" aria-label="未读" /> : null}</h2><p>{item.body}</p><time dateTime={item.createdAt}>{malaysiaDateTimeFormatter.format(new Date(item.createdAt))}</time></Link>)}</div>
    {!visible.length ? <div className="marketing-page-empty"><span className="marketing-empty-mark"><MarketingIcon name="inbox"/></span><h2>目前没有{unreadOnly ? '未读' : ''}通知。</h2><p>{unreadOnly ? '可以切回全部通知查看之前的记录。' : '新的任务和审核消息会显示在这里。'}</p></div> : null}<p className="marketing-caption">显示最近 30 条站内通知。外部平台的私信和评论尚未连接。</p>
  </section>;
}
