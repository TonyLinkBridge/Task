import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMarketingTestClient } from '../../marketing/runtime/local-database.mjs';

const state = vi.hoisted(() => ({ client: null as unknown }));
vi.mock('@/lib/supabase/admin', () => ({ getSupabaseAdmin: () => state.client }));
import { inAppNotificationRepository as repository } from '@/features/notifications/in-app-repository';

let database: PGlite | undefined;
afterEach(async () => { await database?.close(); database = undefined; });
async function setup() {
  database = new PGlite();
  await database.exec(`create table in_app_notifications(id uuid primary key, recipient_id text not null,
    title text, body text, href text, read_at timestamptz, created_at timestamptz default now());
    alter table in_app_notifications enable row level security;
    insert into in_app_notifications(id,recipient_id,title,body,href) values
    ('11111111-1111-4111-8111-111111111111','alice','Alice','one','/tasks'),
    ('22222222-2222-4222-8222-222222222222','bob','Bob','two','/tasks');`);
  const migration = await readFile('supabase/migrations/20261025215221_notification_center_dismissal.sql', 'utf8');
  await database.exec(migration);
  await database.exec(migration); // Safe to apply after an interrupted deployment, without losing data.
  const runtime = await createMarketingTestClient({ existingDatabase: database } as never);
  state.client = runtime.client;
}
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
describe('notification persistence and recipient isolation', () => {
  it('reads/unreads/dismisses only the recipient rows; dismissal retains inbox history', async () => {
    await setup();
    await repository.mutate('alice', 'read', [alice, bob]);
    expect((await repository.list('alice'))[0].readAt).toBeTruthy();
    expect((await repository.list('bob'))[0].readAt).toBeNull();
    await repository.mutate('alice', 'unread', [alice]);
    expect((await repository.list('alice'))[0].readAt).toBeNull();
    await repository.mutate('alice', 'dismiss', [alice, bob]);
    expect(await repository.list('alice', { bell: true })).toEqual([]);
    expect(await repository.list('alice')).toHaveLength(1);
    expect(await repository.list('bob', { bell: true })).toHaveLength(1);
    const security = await database!.query<{relrowsecurity: boolean}>("select relrowsecurity from pg_class where relname='in_app_notifications'");
    expect(security.rows[0].relrowsecurity).toBe(true);
  }, 20000);
  it('keeps legacy mark-all-read scoped to its member', async () => {
    await setup();
    await repository.markAllRead('alice');
    expect((await repository.list('alice'))[0].readAt).toBeTruthy();
    expect((await repository.list('bob'))[0].readAt).toBeNull();
  }, 20000);
});
