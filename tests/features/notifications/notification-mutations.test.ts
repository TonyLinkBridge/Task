import { describe, expect, it, vi } from 'vitest';
import { makeInAppNotificationsHandler } from '@/features/notifications/in-app-handler';

const id = '11111111-1111-4111-8111-111111111111';
const user = { id: 'employee', role: 'employee' as const, name: 'Employee', imageUrl: null };
const request = (body: unknown) => new Request('http://localhost/api/notifications', {
  method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
function setup() {
  const mutate = vi.fn(async () => undefined);
  return { mutate, handler: makeInAppNotificationsHandler({
    getVerifiedUser: async () => user, list: async () => [], markAllRead: async () => undefined, mutate,
  }) };
}
describe('notification mutations', () => {
  it.each(['read', 'unread', 'dismiss'] as const)('scopes %s to the authenticated recipient', async action => {
    const { handler, mutate } = setup();
    expect((await handler.PATCH(request({ action, ids: [id], recipientId: 'someone-else' }))).status).toBe(200);
    expect(mutate).toHaveBeenCalledWith(user.id, action, [id]);
  });
  it.each([{ action: 'delete', ids: [id] }, { action: 'read', ids: [] },
    { action: 'read', ids: ['bad'] }, { action: 'dismiss', ids: Array(31).fill(id) }])('rejects malformed and unbounded operations', async body => {
    const { handler, mutate } = setup();
    expect((await handler.PATCH(request(body))).status).toBe(400);
    expect(mutate).not.toHaveBeenCalled();
  });
  it('deduplicates notification IDs for a bulk request', async () => {
    const { handler, mutate } = setup();
    await handler.PATCH(request({ action: 'read', ids: [id, id] }));
    expect(mutate).toHaveBeenCalledWith(user.id, 'read', [id]);
  });
  it('returns a server error for a failed save, not a false success or login error', async () => {
    const { handler, mutate } = setup();
    mutate.mockRejectedValueOnce(Error('database failure'));
    expect((await handler.PATCH(request({ action: 'read', ids: [id] }))).status).toBe(500);
  });
  it('does not perform mutations without a verified login', async () => {
    const mutate = vi.fn();
    const handler = makeInAppNotificationsHandler({ getVerifiedUser: async () => { throw Error('unauthorized'); }, list: async () => [], markAllRead: vi.fn(), mutate });
    expect((await handler.PATCH(request({ action: 'dismiss', ids: [id] }))).status).toBe(403);
    expect(mutate).not.toHaveBeenCalled();
  });
});
