import { readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

describe("help article feedback migration", () => {
  it("keeps only the member's latest feedback for an article", async () => {
    const database = new PGlite();
    for (const name of [
      "202608280001_profiles.sql",
      "202609030001_help_article_feedback.sql",
    ]) {
      await database.exec(
        await readFile(
          path.resolve(import.meta.dirname, "../../supabase/migrations", name),
          "utf8"
        )
      );
    }

    await database.exec(`
      insert into profiles (
        clerk_user_id, role, display_name, slack_team_id, slack_verified_at
      ) values ('employee', 'employee', '员工', 'T094DTFCVA8', now());

      insert into help_article_feedback (
        article_slug, clerk_user_id, helpful, comment
      ) values ('内容审核/提交审核', 'employee', false, '步骤不清楚');

      insert into help_article_feedback (
        article_slug, clerk_user_id, helpful, comment
      ) values ('内容审核/提交审核', 'employee', true, null)
      on conflict (article_slug, clerk_user_id) do update set
        helpful = excluded.helpful,
        comment = excluded.comment,
        updated_at = now();
    `);

    const rows = await database.query<{
      article_slug: string;
      clerk_user_id: string;
      helpful: boolean;
      comment: string | null;
    }>("select article_slug, clerk_user_id, helpful, comment from help_article_feedback");

    expect(rows.rows).toEqual([
      {
        article_slug: "内容审核/提交审核",
        clerk_user_id: "employee",
        helpful: true,
        comment: null,
      },
    ]);

    const security = await database.query<{ relrowsecurity: boolean }>(
      "select relrowsecurity from pg_class where relname = 'help_article_feedback'"
    );
    expect(security.rows).toEqual([{ relrowsecurity: true }]);
    await database.close();
  });
});
