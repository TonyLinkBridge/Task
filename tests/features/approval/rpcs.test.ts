import { readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { beforeEach, describe, expect, it } from "vitest";

const migrations = [
  "202608280001_profiles.sql",
  "202608280002_tasks.sql",
  "202608280003_content_core.sql",
  "202608280004_inline_comment_events.sql",
  "202608280006_approval_workflow.sql",
  "202608280007_approval_rpcs.sql",
].map((name) =>
  path.resolve(import.meta.dirname, "../../../supabase/migrations", name)
);

const employeeContentId = "22222222-2222-4222-8222-222222222222";
const adminContentId = "33333333-3333-4333-8333-333333333333";
const platformId = "11111111-1111-4111-8111-111111111111";

describe("approval workflow RPCs", () => {
  let database: PGlite;

  beforeEach(async () => {
    database = new PGlite();
    for (const migrationPath of migrations) {
      await database.exec(await readFile(migrationPath, "utf8"));
    }
    await database.exec(`
      insert into profiles (
        clerk_user_id, role, display_name, slack_team_id, slack_verified_at
      ) values
        ('employee', 'employee', '员工', 'T094DTFCVA8', now()),
        ('admin-a', 'admin', '上司 A', 'T094DTFCVA8', now()),
        ('admin-b', 'admin', '上司 B', 'T094DTFCVA8', now());
      insert into platforms (id, name) values ('${platformId}', 'Instagram');
    `);
  });

  it("does not expose identity-spoofable workflow functions to public callers", async () => {
    const functions = await database.query<{ proname: string; proacl: string | null }>(`
      select proname, proacl::text
      from pg_proc
      where proname in (
        'create_scheduled_content', 'submit_content_for_review',
        'approve_content_version', 'request_content_changes',
        'unlock_approved_content', 'mark_content_published', 'archive_content',
        'create_content_snapshot', 'save_content_attachment'
      )
      order by proname
    `);

    expect(functions.rows).toHaveLength(9);
    for (const item of functions.rows) {
      expect(item.proacl, item.proname).not.toBeNull();
      expect(item.proacl, item.proname).not.toMatch(/(^|[{,])=X/);
    }
  });

  it("saves attachments only while the parent content row is editable", async () => {
    await database.exec(`
      select create_scheduled_content(
        '${employeeContentId}', '员工内容', 'employee', 'employee',
        '2026-08-29T02:00:00.000Z', array['${platformId}']::uuid[]
      );
      select save_content_attachment(
        '${employeeContentId}', '${employeeContentId}/draft.png', 'draft.png',
        'image/png', 1024, 'employee'
      );
      select submit_content_for_review(
        '${employeeContentId}', 'employee', '[{"type":"paragraph"}]'::jsonb, null
      );
    `);

    await expect(
      database.exec(`
        select save_content_attachment(
          '${employeeContentId}', '${employeeContentId}/late.png', 'late.png',
          'image/png', 1024, 'employee'
        )
      `)
    ).rejects.toThrow(/CONTENT_NOT_EDITABLE/);

    const attachments = await database.query<{ file_name: string }>(`
      select file_name from content_attachments
      where content_id = '${employeeContentId}' order by file_name
    `);
    expect(attachments.rows).toEqual([{ file_name: "draft.png" }]);
  });

  it("creates a linked publish task and requires two distinct admins", async () => {
    await database.exec(`
      select create_scheduled_content(
        '${employeeContentId}', '员工内容', 'employee', 'employee',
        '2026-08-29T02:00:00.000Z', array['${platformId}']::uuid[]
      );
      insert into content_attachments (
        content_id, storage_path, file_name, mime_type, byte_size, uploader_id
      ) values (
        '${employeeContentId}', '${employeeContentId}/image.png', 'image.png',
        'image/png', 1024, 'employee'
      );
      select submit_content_for_review(
        '${employeeContentId}', 'employee', '[{"type":"paragraph"}]'::jsonb, null
      );
      select approve_content_version('${employeeContentId}', 1, 'admin-a');
      select approve_content_version('${employeeContentId}', 1, 'admin-a');
    `);

    const halfway = await database.query<{
      status: string;
      required_approvals: number;
      approval_count: number;
      snapshot_attachments: number;
      linked_task_id: string;
      task_link: string;
    }>(`
      select c.status::text, c.required_approvals,
        count(a.id)::integer as approval_count,
        (select count(*)::integer
         from content_version_attachments cva
         join content_versions cv on cv.id = cva.content_version_id
         where cv.content_id = c.id and cv.version = c.current_version
        ) as snapshot_attachments,
        c.linked_task_id::text,
        t.linked_content_id::text as task_link
      from contents c
      join tasks t on t.id = c.linked_task_id
      left join content_approvals a
        on a.content_id = c.id and a.invalidated_at is null
      where c.id = '${employeeContentId}'
      group by c.id, t.linked_content_id
    `);

    expect(halfway.rows[0]).toMatchObject({
      status: "in_review",
      required_approvals: 2,
      approval_count: 1,
      snapshot_attachments: 1,
      task_link: employeeContentId,
    });

    await database.exec(
      `select approve_content_version('${employeeContentId}', 1, 'admin-b')`
    );
    const finished = await database.query<{ status: string }>(
      `select status::text from contents where id = '${employeeContentId}'`
    );
    expect(finished.rows[0].status).toBe("approved");
  });

  it("invalidates old approvals when approved content is unlocked and resubmitted", async () => {
    await database.exec(`
      select create_scheduled_content(
        '${employeeContentId}', '员工内容', 'employee', 'employee',
        '2026-08-29T02:00:00.000Z', array['${platformId}']::uuid[]
      );
      select submit_content_for_review(
        '${employeeContentId}', 'employee', '[{"version":1}]'::jsonb, null
      );
      select approve_content_version('${employeeContentId}', 1, 'admin-a');
      select approve_content_version('${employeeContentId}', 1, 'admin-b');
      select unlock_approved_content('${employeeContentId}', 'employee');
      select submit_content_for_review(
        '${employeeContentId}', 'employee', '[{"version":2}]'::jsonb, null
      );
    `);

    await expect(
      database.exec(
        `select approve_content_version('${employeeContentId}', 1, 'admin-a')`
      )
    ).rejects.toThrow(/CONTENT_VERSION_STALE/);

    const state = await database.query<{
      current_version: number;
      status: string;
      active_approvals: number;
      invalid_approvals: number;
    }>(`
      select c.current_version, c.status::text,
        count(a.id) filter (where a.invalidated_at is null)::integer as active_approvals,
        count(a.id) filter (where a.invalidated_at is not null)::integer as invalid_approvals
      from contents c
      left join content_approvals a on a.content_id = c.id
      where c.id = '${employeeContentId}'
      group by c.id
    `);
    expect(state.rows[0]).toEqual({
      current_version: 2,
      status: "in_review",
      active_approvals: 0,
      invalid_approvals: 2,
    });
  });

  it("supports request changes, resubmission, and fresh two-admin approval", async () => {
    await database.exec(`
      select create_scheduled_content(
        '${employeeContentId}', '员工内容', 'employee', 'employee',
        '2026-08-29T02:00:00.000Z', array['${platformId}']::uuid[]
      );
      select submit_content_for_review(
        '${employeeContentId}', 'employee', '[{"version":1}]'::jsonb, null
      );
      select approve_content_version('${employeeContentId}', 1, 'admin-a');
      select request_content_changes(
        '${employeeContentId}', 1, 'admin-b', '请修改开头'
      );
      select submit_content_for_review(
        '${employeeContentId}', 'employee', '[{"version":2}]'::jsonb, null
      );
      select approve_content_version('${employeeContentId}', 2, 'admin-a');
      select approve_content_version('${employeeContentId}', 2, 'admin-b');
    `);

    const result = await database.query<{
      status: string;
      current_version: number;
      active_approvals: number;
      change_requests: number;
    }>(`
      select c.status::text, c.current_version,
        count(distinct a.admin_id) filter (where a.invalidated_at is null)::integer as active_approvals,
        (select count(*)::integer from content_review_events e
         where e.content_id = c.id and e.event_type = 'changes_requested') as change_requests
      from contents c
      left join content_approvals a on a.content_id = c.id
      where c.id = '${employeeContentId}'
      group by c.id
    `);
    expect(result.rows[0]).toEqual({
      status: "approved",
      current_version: 2,
      active_approvals: 2,
      change_requests: 1,
    });
  });

  it("honors an admin author's chosen reviewer and finishes the linked task on publish", async () => {
    await database.exec(`
      select create_scheduled_content(
        '${adminContentId}', '管理员内容', 'admin-a', 'employee',
        '2026-08-29T02:00:00.000Z', array['${platformId}']::uuid[]
      );
    `);
    await expect(
      database.exec(`
        select submit_content_for_review(
          '${adminContentId}', 'admin-b', '[{"type":"paragraph"}]'::jsonb, 'admin-b'
        )
      `)
    ).rejects.toThrow(/CONTENT_FORBIDDEN/);

    await database.exec(`
      select submit_content_for_review(
        '${adminContentId}', 'admin-a', '[{"type":"paragraph"}]'::jsonb, 'admin-b'
      );
    `);

    await expect(
      database.exec(
        `select approve_content_version('${adminContentId}', 1, 'admin-a')`
      )
    ).rejects.toThrow(/CONTENT_REVIEWER_MISMATCH/);

    await database.exec(`
      select approve_content_version('${adminContentId}', 1, 'admin-b');
      select mark_content_published('${adminContentId}', 'employee');
    `);
    const state = await database.query<{
      status: string;
      required_approvals: number;
      published_by: string;
      task_status: string;
    }>(`
      select c.status::text, c.required_approvals, c.published_by,
        t.status::text as task_status
      from contents c join tasks t on t.id = c.linked_task_id
      where c.id = '${adminContentId}'
    `);
    expect(state.rows[0]).toEqual({
      status: "published",
      required_approvals: 1,
      published_by: "employee",
      task_status: "done",
    });
  });
});
