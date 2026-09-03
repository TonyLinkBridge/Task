import { readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

const migrations = [
  "202608280001_profiles.sql",
  "202608280002_tasks.sql",
  "202608280003_content_core.sql",
  "202608280008_notifications_audit.sql",
].map((name) =>
  path.resolve(import.meta.dirname, "../../supabase/migrations", name)
);

describe("notifications and audit migration", () => {
  it("creates protected settings, delivery, and history tables", async () => {
    const database = new PGlite();

    for (const migrationPath of migrations) {
      await database.exec(await readFile(migrationPath, "utf8"));
    }

    const protectedTables = await database.query<{
      relname: string;
      relrowsecurity: boolean;
    }>(
      `select relname, relrowsecurity
       from pg_class
       where relname in (
         'notification_settings', 'slack_deliveries', 'audit_events'
       )
       order by relname`
    );
    const settings = await database.query<{
      reminder_minutes: number;
      publish_due: boolean;
    }>(
      `select reminder_minutes,
              (enabled_events ->> 'publish_due')::boolean as publish_due
       from notification_settings
       where id = true`
    );

    expect(protectedTables.rows).toEqual([
      { relname: "audit_events", relrowsecurity: true },
      { relname: "notification_settings", relrowsecurity: true },
      { relname: "slack_deliveries", relrowsecurity: true },
    ]);
    expect(settings.rows).toEqual([
      { reminder_minutes: 1440, publish_due: true },
    ]);

    await database.close();
  });
});
