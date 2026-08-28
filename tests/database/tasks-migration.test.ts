import { readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

const migrations = [
  "202608280001_profiles.sql",
  "202608280002_tasks.sql",
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

    await database.close();
  });
});
