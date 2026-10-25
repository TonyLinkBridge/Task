import { PGlite } from '@electric-sql/pglite';
import { expect, it } from 'vitest';
import { createMarketingTestClient } from '../../marketing/runtime/local-database.mjs';
import { createTaskRepository } from '@/features/tasks/repository';

it('distinguishes archived, active and missing targets without restoring tasks or deleting notifications', async () => {
  const db = new PGlite();
  const runtime = await createMarketingTestClient({ existingDatabase: db } as never);
  const active = '11111111-1111-4111-8111-111111111111';
  const archived = '22222222-2222-4222-8222-222222222222';
  try {
    await db.exec(`create table tasks(id uuid primary key,title text,project text,description text,status text,priority text,kind text,
      assignee_id text,creator_id text,due_at timestamptz,position numeric,linked_content_id uuid,archived_at timestamptz,created_at timestamptz,updated_at timestamptz);
      insert into tasks values('${active}','Active','','','todo','medium','general','employee','admin',now(),1000,null,null,now(),now()),
        ('${archived}','Archived','','','done','medium','general','employee','admin',now(),2000,null,now(),now(),now());
      create table in_app_notifications(id uuid primary key,recipient_id text,href text);
      insert into in_app_notifications values('33333333-3333-4333-8333-333333333333','employee','/tasks/${archived}');`);
    const repository = createTaskRepository(runtime.client as never);
    expect(await repository.get(archived)).toBeNull();
    expect(await repository.isArchived(archived)).toBe(true);
    expect(await repository.isArchived(active)).toBe(false);
    expect((await repository.get(active))?.id).toBe(active);
    expect(await repository.isArchived('44444444-4444-4444-8444-444444444444')).toBe(false);
    expect((await db.query('select count(*)::int n from tasks where archived_at is not null')).rows).toEqual([{ n: 1 }]);
    expect((await db.query('select href from in_app_notifications')).rows).toEqual([{ href: `/tasks/${archived}` }]);
  } finally { await runtime.close(); }
}, 20000);
