import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ canWrite: null as boolean | null, refresh: vi.fn(), broadcast: vi.fn(), listener: () => {} }));
vi.mock('@liveblocks/react', () => ({ useSelf: () => state.canWrite, useBroadcastEvent: () => state.broadcast, useEventListener: (listener: () => void) => { state.listener = listener; } }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: state.refresh }) }));
import { MarketingRoomPermissionSync } from '@/features/marketing/components/room-permission-sync';

beforeEach(() => { state.canWrite = null; state.refresh.mockClear(); });
describe('marketing room permission synchronization', () => {
  it('refreshes on another client review event even when cached write permission has not changed', () => {
    state.canWrite = true;
    render(<MarketingRoomPermissionSync editable><span>正文</span></MarketingRoomPermissionSync>);
    state.listener();
    expect(state.refresh).toHaveBeenCalledOnce();
  });
  it('waits for identity and leaves matching permissions alone', () => {
    const { rerender } = render(<MarketingRoomPermissionSync editable><span>正文</span></MarketingRoomPermissionSync>);
    state.canWrite = true;
    rerender(<MarketingRoomPermissionSync editable><span>正文</span></MarketingRoomPermissionSync>);
    expect(state.refresh).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('blocks an old editable view and refreshes once when another page locks the room', () => {
    state.canWrite = true;
    const { rerender } = render(<MarketingRoomPermissionSync editable><span>正文</span></MarketingRoomPermissionSync>);
    state.canWrite = false;
    rerender(<MarketingRoomPermissionSync editable><span>正文</span></MarketingRoomPermissionSync>);
    expect(state.refresh).toHaveBeenCalledOnce();
    expect(screen.getByText('正文').parentElement).toHaveAttribute('inert');
    expect(screen.getByRole('status')).toHaveTextContent('正在更新审核状态');
    rerender(<MarketingRoomPermissionSync editable><span>正文</span></MarketingRoomPermissionSync>);
    expect(state.refresh).toHaveBeenCalledOnce();
  });
  it('refreshes a read-only view when changes are requested and releases the guard after updated props', () => {
    state.canWrite = false;
    const { rerender } = render(<MarketingRoomPermissionSync editable={false}><span>正文</span></MarketingRoomPermissionSync>);
    state.canWrite = true;
    rerender(<MarketingRoomPermissionSync editable={false}><span>正文</span></MarketingRoomPermissionSync>);
    expect(state.refresh).toHaveBeenCalledOnce();
    rerender(<MarketingRoomPermissionSync editable><span>正文</span></MarketingRoomPermissionSync>);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('正文').parentElement).not.toHaveAttribute('inert');
  });
});
