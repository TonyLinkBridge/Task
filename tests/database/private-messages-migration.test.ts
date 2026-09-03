import { readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

const migrations = [
  "202608280001_profiles.sql",
  "202608310007_private_messages.sql",
].map((name) =>
  path.resolve(import.meta.dirname, "../../supabase/migrations", name)
);

describe("private messages migration", () => {
  it("stores private member-to-member messages behind row security", async () => {
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
      insert into private_messages (sender_id, recipient_id, body)
      values ('employee', 'admin', '请看任务');
    `);

    const rows = await database.query<{ body: string }>(
      "select body from private_messages"
    );
    expect(rows.rows).toEqual([{ body: "请看任务" }]);
    const security = await database.query<{ relrowsecurity: boolean }>(
      "select relrowsecurity from pg_class where relname = 'private_messages'"
    );
    expect(security.rows).toEqual([{ relrowsecurity: true }]);
    await database.close();
  });
});
