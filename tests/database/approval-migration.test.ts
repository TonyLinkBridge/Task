import { readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

const migrations = [
  "202608280001_profiles.sql",
  "202608280002_tasks.sql",
  "202608280003_content_core.sql",
  "202608280004_inline_comment_events.sql",
  "202608280006_approval_workflow.sql",
].map((name) =>
  path.resolve(import.meta.dirname, "../../supabase/migrations", name)
);

describe("approval workflow migration", () => {
  it("adds approval, review history, publishing, and task links", async () => {
    const database = new PGlite();

    for (const migrationPath of migrations) {
      await database.exec(await readFile(migrationPath, "utf8"));
    }

    const approvalColumns = await database.query<{ column_name: string }>(
      `select column_name
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'content_approvals'
       order by ordinal_position`
    );
    const contentColumns = await database.query<{ column_name: string }>(
      `select column_name
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'contents'
         and column_name in (
           'required_approvals', 'requested_reviewer_id', 'published_by',
           'published_at', 'linked_task_id'
         )
       order by column_name`
    );
    const protectedTables = await database.query<{
      relname: string;
      relrowsecurity: boolean;
    }>(
      `select relname, relrowsecurity
       from pg_class
       where relname in ('content_approvals', 'content_review_events')
       order by relname`
    );

    expect(approvalColumns.rows.map(({ column_name }) => column_name)).toEqual([
      "id",
      "content_id",
      "version",
      "admin_id",
      "approved_at",
      "invalidated_at",
    ]);
    expect(contentColumns.rows.map(({ column_name }) => column_name)).toEqual([
      "linked_task_id",
      "published_at",
      "published_by",
      "requested_reviewer_id",
      "required_approvals",
    ]);
    expect(protectedTables.rows).toEqual([
      { relname: "content_approvals", relrowsecurity: true },
      { relname: "content_review_events", relrowsecurity: true },
    ]);

    await database.close();
  });
});
