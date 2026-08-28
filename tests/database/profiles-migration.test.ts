import { readFile } from "node:fs/promises";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

const migrationPath = path.resolve(
  import.meta.dirname,
  "../../supabase/migrations/202608280001_profiles.sql"
);

describe("profiles migration", () => {
  it("creates employee and admin roles with a protected profiles table", async () => {
    const database = new PGlite();
    const migration = await readFile(migrationPath, "utf8");

    await database.exec(migration);

    const roles = await database.query<{ enumlabel: string }>(
      `select enumlabel
       from pg_enum
       join pg_type on pg_type.oid = pg_enum.enumtypid
       where pg_type.typname = 'app_role'
       order by enumsortorder`
    );
    const profiles = await database.query<{ relrowsecurity: boolean }>(
      `select relrowsecurity
       from pg_class
       where oid = 'public.profiles'::regclass`
    );

    expect(roles.rows.map((row) => row.enumlabel)).toEqual([
      "employee",
      "admin",
    ]);
    expect(profiles.rows).toEqual([{ relrowsecurity: true }]);

    await database.close();
  });
});
