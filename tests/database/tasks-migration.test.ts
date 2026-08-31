import { readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

const migrations = [
  "202608280001_profiles.sql",
  "202608280002_tasks.sql",
  "202608310002_task_project.sql",
  "202608310003_task_multi_assignees.sql",
].map((name) =>
  path.resolve(import.meta.dirname, "../../supabase/migrations", name)
);

describe("tasks migration", () => {
  it("creates protected task and comment tables with the fixed workflow values", async () => {
    const database = new PGlite();

    for (const migrationPath of migrations) {
      await database.exec(await readFile(migrationPath, "utf8"));
    }

    const statuses = await database.query<{ enumlabel: string }>(
      `select enumlabel
       from pg_enum
       join pg_type on pg_type.oid = pg_enum.enumtypid
       where pg_type.typname = 'task_status'
       order by enumsortorder`
    );
    const protectedTables = await database.query<{
      relname: string;
      relrowsecurity: boolean;
    }>(
      `select relname, relrowsecurity
       from pg_class
       where relname in ('tasks', 'task_comments')
       order by relname`
    );
    const projectColumn = await database.query<{
      column_default: string;
      is_nullable: string;
    }>(
      `select column_default, is_nullable
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'tasks'
         and column_name = 'project'`
    );

    expect(statuses.rows.map(({ enumlabel }) => enumlabel)).toEqual([
      "todo",
      "in_progress",
      "review",
      "done",
    ]);
    expect(protectedTables.rows).toEqual([
      { relname: "task_comments", relrowsecurity: true },
      { relname: "tasks", relrowsecurity: true },
    ]);
    expect(projectColumn.rows).toEqual([
      { column_default: "'一般'::text", is_nullable: "NO" },
    ]);

    await database.exec(`
      insert into profiles (clerk_user_id, role, display_name, slack_team_id, slack_verified_at)
      values
        ('employee', 'employee', 'Employee', 'T094DTFCVA8', now()),
        ('admin', 'admin', 'Admin', 'T094DTFCVA8', now());

      insert into tasks (
        title, project, assignee_id, assignee_ids, creator_id, due_at
      ) values (
        '多人任务', '内容运营', 'employee', array['employee', 'admin'], 'admin', now()
      );

      insert into tasks (
        title, project, kind, assignee_id, assignee_ids, creator_id, due_at
      ) values (
        '发布任务', '内容排期', 'content_publish', 'employee', array['employee', 'admin'], 'admin', now()
      );
    `);
    const assignmentRows = await database.query<{
      title: string;
      assignee_ids: string[];
    }>("select title, assignee_ids from tasks order by title");
    expect(assignmentRows.rows).toEqual([
      { title: "发布任务", assignee_ids: ["employee"] },
      { title: "多人任务", assignee_ids: ["employee", "admin"] },
    ]);

    await database.close();
  });
});
