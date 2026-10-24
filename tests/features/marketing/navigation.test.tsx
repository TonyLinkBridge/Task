import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MarketingNavigation } from '@/features/marketing/components/navigation';
vi.mock('next/navigation', () => ({ usePathname: () => '/marketing/calendar' }));
vi.mock('@/components/theme-toggle', () => ({ ThemeToggle: () => <button>切换显示模式</button> }));
describe('marketing mobile navigation', () => {
  it('exposes the hidden desktop destinations through More and restores focus on Escape', async () => {
    render(<MarketingNavigation active="calendar" />);
    const more = screen.getByRole('button', { name: '更多功能' });
    await userEvent.click(more);
    const dialog = screen.getByRole('dialog', { name: '更多功能' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '文件库' })).toHaveAttribute('href', '/marketing/library');
    expect(screen.getByRole('link', { name: '普通任务' })).toHaveAttribute('href', '/marketing/tasks');
    expect(screen.getByRole('link', { name: '帮助中心' })).toHaveAttribute('href', '/help');
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(more).toHaveFocus();
  });
  it('identifies the active page and closes More before navigating', async () => {
    render(<MarketingNavigation active="calendar" />);
    expect(screen.getByRole('link', { name: '日历' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(screen.getByRole('button', { name: '更多功能' }));
    await userEvent.click(screen.getByRole('link', { name: '文件库' }));
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
  it('exposes history to administrators on desktop and in More', async () => {
    render(<MarketingNavigation active="calendar" role="admin" />);
    expect(screen.getByRole('link', { name: '历史记录' })).toHaveAttribute('href', '/marketing/history');
    await userEvent.click(screen.getByRole('button', { name: '更多功能' }));
    expect(screen.getByRole('link', { name: '历史记录' })).toHaveAttribute('href', '/marketing/history');
  });
  it('does not expose administrator history to employees', async () => {
    render(<MarketingNavigation active="calendar" role="employee" />);
    expect(screen.queryByRole('link', { name: '历史记录' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '更多功能' }));
    expect(screen.queryByRole('link', { name: '历史记录' })).not.toBeInTheDocument();
  });

});
