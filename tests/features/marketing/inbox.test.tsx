import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MarketingInbox } from '@/features/marketing/components/inbox';
import { NotificationCenter } from '@/features/notifications/components/notification-center';
const notification = { id: 'n1', recipientId: 'employee', title: '等待检查', body: '原有内容', href: '/content/abc', readAt: null, createdAt: '2026-10-24T00:00:00Z' };
afterEach(() => vi.unstubAllGlobals());
describe('marketing notification inbox', () => {
  it('updates the header unread badge when the inbox marks notifications read', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ notifications: [notification], unreadCount: 1 }) }).mockResolvedValueOnce({ ok: true });
    vi.stubGlobal('fetch', fetcher);
    render(<><NotificationCenter /><MarketingInbox initialNotifications={[notification]} /></>);
    await screen.findByRole('button', { name: '通知，1 条未读' });
    fireEvent.click(screen.getByRole('button', { name: '全部设为已读' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '通知，0 条未读' })).toBeInTheDocument());
  });
  it('uses current notifications, maps content links and saves read state through the authorized existing endpoint', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true }); vi.stubGlobal('fetch', fetcher);
    render(<MarketingInbox initialNotifications={[notification]} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/marketing/content/abc');
    fireEvent.click(screen.getByRole('button', { name: '全部设为已读' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '未读 0' })).toBeInTheDocument());
    expect(fetcher).toHaveBeenCalledWith('/api/notifications', { method: 'PATCH' });
  });
  it('keeps unread state and displays a retryable error when saving fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    render(<MarketingInbox initialNotifications={[notification]} />);
    fireEvent.click(screen.getByRole('button', { name: '全部设为已读' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('没有保存成功'));
    expect(screen.getByRole('button', { name: '未读 1' })).toBeInTheDocument();
  });
});
