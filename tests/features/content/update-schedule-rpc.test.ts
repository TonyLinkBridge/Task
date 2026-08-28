import { readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";

const migrationNames = [
  "202608280001_profiles.sql",
  "202608280002_tasks.sql",
  "202608280003_content_core.sql",
  "202608280004_inline_comment_events.sql",
  "202608280006_approval_workflow.sql",
  "202608280007_approval_rpcs.sql",
  "202608280008_notifications_audit.sql",
  "202608280009_notification_workflow.sql",
  "202608280010_update_content_schedule.sql",
];

const contentId = "22222222-2222-4222-8222-222222222222";
const platformA = "11111111-1111-4111-8111-111111111111";
const platformB = "33333333-3333-4333-8333-333333333333";
const archivedPlatform = "44444444-4444-4444-8444-444444444444";

describe("update_scheduled_content", () => {
  let database: PGlite;

  beforeEach(async () => {
    database = new PGlite();
    await database.exec(`
      create role anon;
      create role authenticated;
      create role service_role;
      alter default privileges grant execute on functions to anon, authenticated;
    `);
    for (const name of migrationNames) {
      const migrationPath = path.resolve(
        import.meta.dirname,
        "../../../supabase/migrations",
        name
      );
      const sql = await readFile(migrationPath, "utf8").catch(() => "");
      if (sql) await database.exec(sql);
    }
    await database.exec(`
      insert into profiles (
        clerk_user_id, role, display_name, slack_team_id, slack_verified_at,
        archived_at
      ) values
        ('author', 'employee', '员工', 'T094DTFCVA8', now(), null),
        ('old-assignee', 'employee', '旧负责人', 'T094DTFCVA8', now(), null),
        ('new-assignee', 'employee', '新负责人', 'T094DTFCVA8', now(), null),
        ('unrelated', 'employee', '其他员工', 'T094DTFCVA8', now(), null),
        ('admin-a', 'admin', '上司 A', 'T094DTFCVA8', now(), null),
        ('archived-user', 'employee', '停用成员', 'T094DTFCVA8', now(), now());

      insert into platforms (id, name, archived_at) values
        ('${platformA}', 'Instagram', null),
        ('${platformB}', 'LinkedIn', null),
        ('${archivedPlatform}', '停用平台', now());

      select create_scheduled_content(
        '${contentId}', '旧标题', 'author', 'old-assignee',
        '2026-08-29T02:00:00.000Z', array['${platformA}']::uuid[]
      );
    `);
  });

  it("updates content, platforms, linked task, and audit in one operation", async () => {
    await database.exec(`
      select update_scheduled_content(
        '${contentId}', 'author', '新标题', 'new-assignee',
        '2026-08-30T04:30:00.000Z',
        array['${platformA}', '${platformB}']::uuid[]
      );
    `);

    const result = await database.query<{
      title: string;
      assignee_id: string;
      publish_at: string;
      task_title: string;
      task_assignee: string;
      task_due_at: string;
      platforms: string[];
      audit_actor: string;
      before_title: string;
      after_title: string;
    }>(`
      select c.title, c.assignee_id, c.publish_at::text,
        t.title as task_title, t.assignee_id as task_assignee,
        t.due_at::text as task_due_at,
        array(
          select p.name from content_platforms cp
          join platforms p on p.id = cp.platform_id
          where cp.content_id = c.id order by p.name
        ) as platforms,
        (select actor_id from audit_events
         where entity_id = c.id::text and action = 'content_updated'
         order by created_at desc limit 1) as audit_actor,
        (select before_data ->> 'title' from audit_events
         where entity_id = c.id::text and action = 'content_updated'
         order by created_at desc limit 1) as before_title,
        (select after_data ->> 'title' from audit_events
         where entity_id = c.id::text and action = 'content_updated'
         order by created_at desc limit 1) as after_title
      from contents c
      join tasks t on t.id = c.linked_task_id
      where c.id = '${contentId}'
    `);

    expect(result.rows[0]).toEqual({
      title: "新标题",
      assignee_id: "new-assignee",
      publish_at: "2026-08-30 12:30:00+08",
      task_title: "发布 新标题 内容",
      task_assignee: "new-assignee",
      task_due_at: "2026-08-30 12:30:00+08",
      platforms: ["Instagram", "LinkedIn"],
      audit_actor: "author",
      before_title: "旧标题",
      after_title: "新标题",
    });

    const permissions = await database.query<{ proacl: string }>(`
      select proacl::text
      from pg_proc
      where proname = 'update_scheduled_content'
    `);
    expect(permissions.rows[0].proacl).toContain("service_role=X");
    expect(permissions.rows[0].proacl).not.toMatch(/anon=X|authenticated=X/);
  });

  it("rejects an unrelated employee and content under review", async () => {
    await expect(
      database.exec(`
        select update_scheduled_content(
          '${contentId}', 'unrelated', '不能改', 'new-assignee',
          '2026-08-30T04:30:00.000Z', array['${platformA}']::uuid[]
        );
      `)
    ).rejects.toThrow(/CONTENT_FORBIDDEN/);

    await database.exec(`
      update contents set status = 'in_review' where id = '${contentId}';
    `);
    await expect(
      database.exec(`
        select update_scheduled_content(
          '${contentId}', 'admin-a', '不能改', 'new-assignee',
          '2026-08-30T04:30:00.000Z', array['${platformA}']::uuid[]
        );
      `)
    ).rejects.toThrow(/CONTENT_NOT_EDITABLE/);
  });

  it("rejects archived members, archived platforms, and empty platforms", async () => {
    await expect(
      database.exec(`
        select update_scheduled_content(
          '${contentId}', 'admin-a', '新标题', 'archived-user',
          '2026-08-30T04:30:00.000Z', array['${platformA}']::uuid[]
        );
      `)
    ).rejects.toThrow(/CONTENT_ASSIGNEE_INVALID/);

    await expect(
      database.exec(`
        select update_scheduled_content(
          '${contentId}', 'admin-a', '新标题', 'new-assignee',
          '2026-08-30T04:30:00.000Z', array['${archivedPlatform}']::uuid[]
        );
      `)
    ).rejects.toThrow(/CONTENT_PLATFORM_INVALID/);

    await expect(
      database.exec(`
        select update_scheduled_content(
          '${contentId}', 'admin-a', '新标题', 'new-assignee',
          '2026-08-30T04:30:00.000Z', array[]::uuid[]
        );
      `)
    ).rejects.toThrow(/CONTENT_PLATFORM_REQUIRED/);
  });
});
