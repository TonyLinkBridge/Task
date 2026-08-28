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
  "202608280008_notifications_audit.sql",
  "202608280009_notification_workflow.sql",
].map((name) =>
  path.resolve(import.meta.dirname, "../../supabase/migrations", name)
);

const contentId = "22222222-2222-4222-8222-222222222222";
const platformId = "11111111-1111-4111-8111-111111111111";

describe("notification workflow", () => {
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
      update notification_settings
      set slack_channel_id = 'G001', slack_channel_name = '业务赋能';
    `);
  });

  it("queues submission and distinct approval notifications exactly once", async () => {
    await database.exec(`
      select create_scheduled_content(
        '${contentId}', '员工内容', 'employee', 'employee',
        '2026-08-29T02:00:00.000Z', array['${platformId}']::uuid[]
      );
      select submit_content_for_review(
        '${contentId}', 'employee', '[{"type":"paragraph"}]'::jsonb, null
      );
      select approve_content_version('${contentId}', 1, 'admin-a');
      select approve_content_version('${contentId}', 1, 'admin-a');
      select approve_content_version('${contentId}', 1, 'admin-b');
    `);

    const deliveries = await database.query<{
      event_type: string;
      channel_id: string;
      title: string;
    }>(`
      select event_type, channel_id, payload #>> '{content,title}' as title
      from slack_deliveries order by created_at, event_type
    `);
    const audit = await database.query<{ action: string }>(`
      select action from audit_events
      where entity_type = 'content' and entity_id = '${contentId}'
      order by created_at, action
    `);

    expect(deliveries.rows).toEqual([
      { event_type: "all_approved", channel_id: "G001", title: "员工内容" },
      { event_type: "first_approved", channel_id: "G001", title: "员工内容" },
      { event_type: "submitted", channel_id: "G001", title: "员工内容" },
    ]);
    expect(audit.rows.map(({ action }) => action).sort()).toEqual([
      "approved",
      "approved",
      "content_created",
      "submitted",
    ]);
  });

  it("queues an admin-only warning when unapproved content is due", async () => {
    await database.exec(`
      select create_scheduled_content(
        '${contentId}', '迟到内容', 'employee', 'employee',
        '2026-08-28T02:00:00.000Z', array['${platformId}']::uuid[]
      );
      select schedule_due_content_notifications('2026-08-28T08:00:00.000Z');
      select schedule_due_content_notifications('2026-08-28T08:01:00.000Z');
    `);

    const deliveries = await database.query<{ event_type: string }>(`
      select event_type from slack_deliveries order by event_type
    `);
    const content = await database.query<{ status: string }>(`
      select status::text from contents where id = '${contentId}'
    `);

    expect(deliveries.rows).toEqual([
      { event_type: "publish_due_unapproved" },
    ]);
    expect(content.rows[0].status).toBe("draft");
  });

  it("claims each ready delivery once and stops after five attempts", async () => {
    await database.exec(`
      select create_scheduled_content(
        '${contentId}', '队列内容', 'employee', 'employee',
        '2026-08-29T02:00:00.000Z', array['${platformId}']::uuid[]
      );
      select submit_content_for_review(
        '${contentId}', 'employee', '[{"type":"paragraph"}]'::jsonb, null
      );
    `);

    const first = await database.query<{ id: string; attempt_count: number }>(`
      select id::text, attempt_count
      from claim_slack_deliveries('2026-08-30T08:00:00.000Z', 10)
    `);
    const second = await database.query<{ id: string }>(`
      select id::text
      from claim_slack_deliveries('2026-08-30T08:00:00.000Z', 10)
    `);

    expect(first.rows).toHaveLength(1);
    expect(first.rows[0].attempt_count).toBe(1);
    expect(second.rows).toEqual([]);
  });
});
