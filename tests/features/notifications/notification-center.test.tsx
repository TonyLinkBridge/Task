import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotificationCenter } from '@/features/notifications/components/notification-center';
import { MarketingInbox } from '@/features/marketing/components/inbox';
import type { InAppNotification } from '@/features/notifications/in-app-types';

const id = '11111111-1111-4111-8111-111111111111';
const seed: InAppNotification = { id, recipientId: 'employee', title: '你有新任务', body: '准备周报', href: '/tasks/22222222-2222-4222-8222-222222222222', readAt: null, createdAt: '2026-08-31T03:00:00.000Z' };
afterEach(() => vi.unstubAllGlobals());
function mockServer(initial: InAppNotification[] = [seed]) {
  let records = initial.map(item => ({ ...item }));
  const fetchMock = vi.fn(async (_url: unknown, init?: RequestInit) => {
    if (init?.method === 'PATCH') {
      const { action, ids } = JSON.parse(String(init.body));
      records = records.map(item => !ids.includes(item.id) ? item : action === 'dismiss'
        ? { ...item, dismissedAt: '2026-10-26T00:00:00Z' }
        : { ...item, readAt: action === 'read' ? '2026-10-26T00:00:00Z' : null });
      return { ok: true, json: async () => ({ ok: true }) };
    }
    return { ok: true, json: async () => ({ notifications: records.filter(item => !item.dismissedAt) }) };
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, records: () => records, writes: () => fetchMock.mock.calls.filter(([, init]) => init?.method === 'PATCH') };
}
async function open() {
  fireEvent.click(await screen.findByRole('button', { name: /通知中心，\d+ 条未读/ }));
  await waitFor(() => expect(screen.queryByText('正在读取通知…')).not.toBeInTheDocument());
  return screen.getByRole('dialog', { name: '通知中心' });
}
describe('Arc notification center with real server adapter', () => {
  it('marks all visible notifications read with one request and persists after remount', async () => {
    const server = mockServer([seed, { ...seed, id: '33333333-3333-4333-8333-333333333333', title: '审核更新' }]);
    const result = render(<NotificationCenter />);
    await open();
    fireEvent.click(screen.getByRole('button', { name: '全部设为已读' }));
    await waitFor(() => expect(screen.queryByText('正在保存…')).not.toBeInTheDocument());
    expect(server.writes()).toHaveLength(1);
    expect(JSON.parse(String(server.writes()[0][1]?.body))).toEqual({ action: 'read', ids: [id, '33333333-3333-4333-8333-333333333333'] });
    result.unmount(); render(<NotificationCenter />);
    expect(await screen.findByRole('button', { name: '通知中心，0 条未读' })).toBeInTheDocument();
    await open();
    expect(screen.queryByRole('button', { name: '全部设为已读' })).not.toBeInTheDocument();
  });
  it('expands details, maps the original destination and toggles read/unread', async () => {
    const server = mockServer(); render(<NotificationCenter mapHref={href => `/marketing${href}`} />);
    await open();
    fireEvent.click(screen.getByRole('button', { name: /你有新任务.*展开详情/ }));
    expect(screen.getByRole('link', { name: '打开详情' })).toHaveAttribute('href', `/marketing${seed.href}`);
    fireEvent.click(screen.getByRole('button', { name: '设为已读' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '设为未读' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: '设为未读' }));
    await waitFor(() => expect(server.records()[0].readAt).toBeNull());
    expect(screen.getByRole('button', { name: '通知中心，1 条未读' })).toBeInTheDocument();
  });
  it('dismisses only from the bell and keeps the inbox record', async () => {
    const server = mockServer(); render(<><NotificationCenter /><MarketingInbox initialNotifications={[seed]} /></>);
    const panel = await open();
    fireEvent.click(within(panel).getByRole('button', { name: /你有新任务.*展开详情/ }));
    fireEvent.click(within(panel).getByRole('button', { name: '移除' }));
    await waitFor(() => expect(within(panel).queryByRole('button', { name: /你有新任务.*展开详情/ })).not.toBeInTheDocument());
    expect(screen.getByRole('link', { name: /你有新任务/ })).toBeInTheDocument();
    expect(server.records()[0].dismissedAt).toBeTruthy();
  });
  it('clears read notifications in one request without clearing unread ones', async () => {
    const server = mockServer([seed, { ...seed, id: '33333333-3333-4333-8333-333333333333', title: '已读记录', readAt: seed.createdAt }]);
    render(<NotificationCenter />); await open();
    fireEvent.click(screen.getByRole('button', { name: '清空已读' }));
    await waitFor(() => expect(server.writes()).toHaveLength(1));
    expect(JSON.parse(String(server.writes()[0][1]?.body))).toEqual({ action: 'dismiss', ids: ['33333333-3333-4333-8333-333333333333'] });
    expect(screen.getByRole('button', { name: /你有新任务.*展开详情/ })).toBeInTheDocument();
  });
  it('restores the unread state and shows an error when saving fails', async () => {
    const server = mockServer(); render(<NotificationCenter />); await open();
    server.fetchMock.mockRejectedValueOnce(Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: '全部设为已读' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('已恢复原状');
    expect(screen.getByRole('button', { name: '通知中心，1 条未读' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '全部设为已读' })).toBeEnabled();
  });
  it('retains keyboard focus during a pending save and prevents duplicate writes', async () => {
    const server = mockServer(); const user = userEvent.setup();
    render(<NotificationCenter />); await open();
    await user.click(screen.getByRole('button', { name: /你有新任务.*展开详情/ }));
    let finish!: (value: { ok: boolean; json: () => Promise<{ ok: boolean }> }) => void;
    server.fetchMock.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const action = screen.getByRole('button', { name: '设为已读' });
    await user.click(action);
    expect(action).toHaveFocus();
    expect(action).toHaveAttribute('aria-disabled', 'true');
    await user.keyboard('{Enter}{Enter}');
    expect(server.writes()).toHaveLength(1);
    finish({ ok: true, json: async () => ({ ok: true }) });
    await waitFor(() => expect(action).not.toHaveAttribute('aria-disabled'));
  });
  it('offers retry for loading errors instead of pretending the list is empty', async () => {
    const server = mockServer();
    const successful = server.fetchMock.getMockImplementation()!;
    server.fetchMock.mockRejectedValue(Error('offline'));
    render(<NotificationCenter />); await open();
    expect(await screen.findByRole('alert')).toHaveTextContent('加载失败');
    expect(screen.queryByText('目前没有通知')).not.toBeInTheDocument();
    server.fetchMock.mockImplementation(successful);
    fireEvent.click(screen.getByRole('button', { name: '重新加载通知' }));
    expect(await screen.findByRole('button', { name: /你有新任务.*展开详情/ })).toBeInTheDocument();
  });
  it('supports Enter/Space activation and Escape restores focus to the bell', async () => {
    mockServer(); const user = userEvent.setup(); render(<NotificationCenter />);
    const trigger = await screen.findByRole('button', { name: '通知中心，1 条未读' });
    trigger.focus(); await user.keyboard('{Enter}');
    const row = await screen.findByRole('button', { name: /你有新任务.*展开详情/ });
    row.focus(); await user.keyboard(' ');
    expect(row).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
  });
  it('moves focus back to the unread toggle after reading the final unread row', async () => {
    mockServer(); render(<NotificationCenter />); await open();
    fireEvent.click(screen.getByRole('button', { name: '未读' }));
    fireEvent.click(screen.getByRole('button', { name: /你有新任务.*展开详情/ }));
    fireEvent.click(screen.getByRole('button', { name: '设为已读' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '未读' })).toHaveFocus());
  });
});
