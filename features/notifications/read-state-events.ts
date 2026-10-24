'use client';
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
