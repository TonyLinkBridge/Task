import { chooseOption } from "@/tests/helpers/choose-option";
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MarketingCalendar } from '@/features/marketing/components/calendar';
import type { ScheduledContent } from '@/features/schedule/types';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));
const content = (id: string, publishAt: string, overrides = {}): ScheduledContent => ({
  id, title: id, publishAt, status: 'in_review', storedStatus: 'in_review',
  assignee: { id: 'employee', name: '员工', imageUrl: null },
  platforms: [{ id: 'telegram', name: 'Telegram', color: '#00b5c8' }], requiredApprovals: 2, approvalAdminIds: [], ...overrides,
});
const contents = [content('马来西亚周一', '2026-10-18T16:30:00Z'), content('周末内容', '2026-10-25T02:00:00Z'), content('下周内容', '2026-10-26T02:00:00Z', { platforms: [{ id: 'custom', name: '自订平台', color: '#123456' }], status: 'draft' })];
describe('connected marketing calendar', () => {
  it('shows the Malaysia week, links to actual content and moves between weeks', async () => {
    render(<MarketingCalendar contents={contents} initialDate="2026-10-24" />);
    expect(within(screen.getByRole('region', { name: '排期内容' })).getByRole('link', { name: /马来西亚周一/ })).toHaveAttribute('href', '/marketing/content/' + encodeURIComponent('马来西亚周一'));
    expect(within(screen.getByRole('region', { name: '排期内容' })).getByRole('link', { name: /周末内容/ })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: '排期内容' })).queryByRole('link', { name: /下周内容/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '下一周' }));
    expect(within(screen.getByRole('region', { name: '排期内容' })).getByRole('link', { name: /下周内容/ })).toBeInTheDocument();
  });
  it('jumps from the mini month to the selected Malaysia week', async () => {
    render(<MarketingCalendar contents={contents} initialDate="2026-10-24" />);
    await userEvent.click(screen.getByRole('button', { name: '跳到 2026-10-26' }));
    expect(within(screen.getByRole('region', { name: '排期内容' })).getByRole('link', { name: /下周内容/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^周$/ })).toHaveAttribute('aria-pressed', 'true');
  });
  it('switches month/list and filters custom platform and status without changing records', async () => {
    render(<MarketingCalendar contents={contents} initialDate="2026-10-24" />);
    await userEvent.click(screen.getByRole('button', { name: '月' }));
    expect(screen.getByRole('button', { name: '月' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(screen.getByRole('grid')).getAllByRole('gridcell')).toHaveLength(42);
    await userEvent.click(screen.getByRole('button', { name: '清单' }));
    await chooseOption(userEvent, "发布平台", "自订平台");
    expect(within(screen.getByRole('region', { name: '排期内容' })).getByRole('link', { name: /下周内容/ })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: '排期内容' })).queryByRole('link', { name: /周末内容/ })).not.toBeInTheDocument();
    await chooseOption(userEvent, "内容状态", "等待审核");
    expect(screen.getByText('这段时间没有符合条件的内容。')).toBeInTheDocument();
  });
  it('filters assignee and inclusive Malaysia dates, then clears all filters', async () => {
    const items = [...contents, content('Haley周末', '2026-10-24T16:15:00Z', { assignee: { id: 'haley', name: 'Haley', imageUrl: null } })];
    render(<MarketingCalendar contents={items} initialView="list" />);
    await chooseOption(userEvent, '负责人', 'Haley');
    await userEvent.type(screen.getByLabelText('开始日期'), '2026-10-25');
    await userEvent.type(screen.getByLabelText('结束日期'), '2026-10-25');
    const region = within(screen.getByRole('region', { name: '排期内容' }));
    expect(region.getByRole('link', { name: /Haley周末/ })).toBeInTheDocument();
    expect(region.queryByRole('link', { name: /周末内容/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '清除筛选' }));
    expect(region.getByRole('link', { name: /下周内容/ })).toBeInTheDocument();
    expect(screen.getByLabelText('开始日期')).toHaveValue('');
    expect(screen.getByLabelText('结束日期')).toHaveValue('');
  });
  it('restores board with actual moves and new detail links without approval shortcuts', async () => {
    const moveAction = vi.fn(async () => ({ ok: true as const }));
    render(<MarketingCalendar contents={contents} initialView="board" moveAction={moveAction} />);
    const draft = within(screen.getByRole('region', { name: '草稿' }));
    expect(draft.getByRole('link', { name: '下周内容' })).toHaveAttribute('href', '/marketing/content/下周内容');
    await userEvent.click(draft.getByRole('button', { name: '把下周内容移动到需要修改' }));
    expect(moveAction).toHaveBeenCalledWith('下周内容', 'changes_requested');
    expect(refresh).toHaveBeenCalledOnce();
    expect(within(screen.getByRole('region', { name: '等待审核' })).queryByRole('button')).not.toBeInTheDocument();
  });
  it('keeps filter choices available even when no content matches', async () => {
    render(<MarketingCalendar contents={[]} initialView="list" platforms={[{ id: 'custom', name: '独立平台', color: '#123456' }]} assignees={[{ id: 'haley', name: 'Haley' }]} />);
    await chooseOption(userEvent, '发布平台', '独立平台');
    await chooseOption(userEvent, '负责人', 'Haley');
    expect(screen.getByText('这段时间没有符合条件的内容。')).toBeInTheDocument();
  });

  it('keeps the original list approval progress and counts each administrator once', () => {
    render(<MarketingCalendar contents={[content('审核人数', '2026-10-25T00:00:00Z', { approvalAdminIds: ['admin-a', 'admin-a'], requiredApprovals: 2 })]} initialView="list" />);
    expect(within(screen.getByRole('region', { name: '排期内容' })).getByRole('link', { name: /审核人数/ })).toHaveTextContent('已批准 1/2');
  });

});
