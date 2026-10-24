import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ user: { id: 'employee', role: 'employee', name: '员工', imageUrl: null }, allPlatforms: vi.fn(), activePlatforms: vi.fn(), notificationSettings: vi.fn(), deliveries: vi.fn(), audits: vi.fn(), token: '', channels: vi.fn() }));
vi.mock('@/lib/auth/get-verified-user', () => ({ getVerifiedUser: async () => state.user }));
vi.mock('@/features/marketing/components/shell', () => ({ MarketingShell: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('@/features/content/repository', () => ({ contentRepository: { listAllPlatforms: state.allPlatforms, listPlatforms: state.activePlatforms } }));
vi.mock('@/features/admin/actions/platforms', () => ({ createPlatform: vi.fn(), updatePlatform: vi.fn(), archivePlatform: vi.fn(), restorePlatform: vi.fn() }));
vi.mock('@/features/admin/components/platform-settings', () => ({ PlatformSettings: () => <button>管理员平台编辑器</button> }));
vi.mock('@/features/admin/repository', () => ({ adminRepository: { getNotificationSettings: state.notificationSettings, listSlackDeliveries: state.deliveries, listAuditEvents: state.audits } }));
vi.mock('@/features/admin/actions/notification-settings', () => ({ saveNotificationSettings: vi.fn() }));
vi.mock('@/components/auth/user-account-menu', () => ({ UserAccountMenu: () => <button>账号菜单</button> }));
vi.mock('@/lib/env/server', () => ({ getServerEnv: () => ({ SLACK_BOT_TOKEN: state.token }) }));
vi.mock('@/lib/slack/client', () => ({ makeSlackClient: () => ({ listAllowedChannels: state.channels }) }));
vi.mock('@/features/schedule/queries', () => ({ listScheduledContent: async () => [] }));
vi.mock('next/navigation', () => ({ redirect: (path: string) => { throw new Error('redirect:' + path); } }));
vi.mock('@/features/admin/actions/retry-slack-delivery', () => ({ retrySlackDelivery: vi.fn() }));
import HistoryPage from '@/app/(protected)/marketing/history/page';
import ChannelsPage from '@/app/(protected)/marketing/channels/page';
import SettingsPage from '@/app/(protected)/marketing/settings/[[...section]]/page';
beforeEach(() => { state.user.role = 'employee'; state.token = ''; vi.clearAllMocks(); state.activePlatforms.mockResolvedValue([{ id: 'platform', name: '自定义平台', color: '#123456', archivedAt: null }]); state.allPlatforms.mockResolvedValue([]); });
describe('marketing server page permission boundaries', () => {
  it('employees see active platform names but never receive administration controls or archived-platform queries', async () => {
    render(await ChannelsPage()); expect(screen.getByText('自定义平台')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '管理员平台编辑器' })).not.toBeInTheDocument(); expect(state.allPlatforms).not.toHaveBeenCalled();
  });
  it('administrators receive canonical platform actions', async () => {
    state.user.role = 'admin'; render(await ChannelsPage());
    expect(screen.getByRole('button', { name: '管理员平台编辑器' })).toBeInTheDocument(); expect(state.allPlatforms).toHaveBeenCalledOnce();
  });
  it('employees cannot load workspace channel settings through the notifications tab', async () => {
    render(await SettingsPage({ params: Promise.resolve({ section: ['notifications'] }) }));
    expect(screen.getByText('你的通知')).toBeInTheDocument(); expect(state.notificationSettings).not.toHaveBeenCalled();
  });
  it('rejects employees before either history query', async () => {
    await expect(HistoryPage()).rejects.toThrow('redirect:/access-denied?reason=admin-only');
    expect(state.deliveries).not.toHaveBeenCalled(); expect(state.audits).not.toHaveBeenCalled();
  });
  it('shows canonical delivery and audit logs to administrators', async () => {
    state.user.role = 'admin'; state.deliveries.mockResolvedValue([]); state.audits.mockResolvedValue([]);
    render(await HistoryPage());
    expect(state.deliveries).toHaveBeenCalledOnce(); expect(state.audits).toHaveBeenCalledOnce();
    expect(screen.getByRole('heading', { name: 'Slack 发送记录' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '重要操作记录' })).toBeInTheDocument();
  });

  it('keeps notification settings readable if the channel service fails', async () => {
    state.user.role = 'admin'; state.token = 'test-only-token';
    state.notificationSettings.mockResolvedValue({ slackChannelId: 'saved', slackChannelName: '内容审核', reminderMinutes: 30, enabledEvents: {} });
    state.channels.mockRejectedValue(new Error('channel service unavailable'));
    render(await SettingsPage({ params: Promise.resolve({ section: ['notifications'] }) }));
    expect(screen.getByRole('alert')).toHaveTextContent('频道列表暂时读取失败');
    expect(screen.getByText(/已保存频道：内容审核/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Slack 通知' })).toBeInTheDocument();
  });

});
