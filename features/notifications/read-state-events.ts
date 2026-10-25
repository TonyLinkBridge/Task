'use client';
import type { NotificationMutation } from './in-app-types';
const eventName = 'juyu-notifications-read';
export function announceNotificationsRead(readAt: string) {
  window.dispatchEvent(new CustomEvent(eventName, { detail: { readAt } }));
}
export function onNotificationsRead(callback: (readAt: string) => void) {
  const listener = (event: Event) => {
    const readAt = (event as CustomEvent<{ readAt?: unknown }>).detail?.readAt;
    if (typeof readAt === 'string' && Number.isFinite(Date.parse(readAt))) callback(readAt);
  };
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}

type Change = { action: NotificationMutation; ids: string[]; readAt: string | null };
const changeEvent = 'juyu-notifications-changed';
export function announceNotificationChange(change: Change) {
  window.dispatchEvent(new CustomEvent(changeEvent, { detail: change }));
}
export function onNotificationChange(callback: (change: Change) => void) {
  const listener = (event: Event) => {
    const change = (event as CustomEvent<Change>).detail;
    if (change && ['read', 'unread', 'dismiss'].includes(change.action) && Array.isArray(change.ids)
      && change.ids.every(id => typeof id === 'string')
      && (change.readAt === null || Number.isFinite(Date.parse(change.readAt)))) callback(change);
  };
  window.addEventListener(changeEvent, listener);
  return () => window.removeEventListener(changeEvent, listener);
}
