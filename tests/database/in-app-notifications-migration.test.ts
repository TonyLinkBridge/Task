import { readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

const migrations = [
  "202608280001_profiles.sql",
  "202608280002_tasks.sql",
  "202608280003_content_core.sql",
  "202608310003_task_multi_assignees.sql",
  "202608310006_in_app_notifications.sql",
].map((name) =>
  path.resolve(import.meta.dirname, "../../supabase/migrations", name)
);

describe("in-app notifications migration", () => {
  it("creates a private notification when a task is assigned", async () => {
    const database = new PGlite();
    for (const migrationPath of migrations) {
      await database.exec(await readFile(migrationPath, "utf8"));
    }

    await database.exec(`
      insert into profiles (
        clerk_user_id, role, display_name, slack_team_id, slack_verified_at
      ) values
        ('employee', 'employee', '员工', 'T094DTFCVA8', now()),
        ('admin', 'admin', '上司', 'T094DTFCVA8', now());

      insert into tasks (
        id, title, assignee_id, assignee_ids, creator_id, due_at
      ) values (
        '11111111-1111-4111-8111-111111111111', '准备周报',
        'employee', array['employee'], 'admin', now()
      );
    `);

    const rows = await database.query<{
      recipient_id: string;
      title: string;
      body: string;
      href: string;
    }>("select recipient_id, title, body, href from in_app_notifications");
    expect(rows.rows).toEqual([
      {
        recipient_id: "employee",
        title: "你有新任务",
        body: "准备周报",
        href: "/tasks/11111111-1111-4111-8111-111111111111",
      },
    ]);

    const security = await database.query<{ relrowsecurity: boolean }>(
      "select relrowsecurity from pg_class where relname = 'in_app_notifications'"
    );
    expect(security.rows).toEqual([{ relrowsecurity: true }]);
    await database.close();
  });
});
