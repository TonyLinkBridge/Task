import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/env/server";

const validEnvironment = {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
  CLERK_SECRET_KEY: "sk_test_example",
  ALLOWED_SLACK_TEAM_ID: "T094DTFCVA8",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-example",
  NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY: "pk_dev_example",
  LIVEBLOCKS_SECRET_KEY: "sk_dev_example",
  LIVEBLOCKS_WEBHOOK_SECRET: "whsec_example",
};

describe("parseServerEnv", () => {
  it("accepts the complete server environment", () => {
    expect(parseServerEnv(validEnvironment)).toEqual(validEnvironment);
  });

  it("rejects a missing Slack team id", () => {
    const missingSlackTeam: Record<string, string> = { ...validEnvironment };
    delete missingSlackTeam.ALLOWED_SLACK_TEAM_ID;

    expect(() => parseServerEnv(missingSlackTeam)).toThrow(
      "ALLOWED_SLACK_TEAM_ID"
    );
  });

  it("rejects a malformed Slack team id", () => {
    expect(() =>
      parseServerEnv({
        ...validEnvironment,
        ALLOWED_SLACK_TEAM_ID: "workspace-one",
      })
    ).toThrow("ALLOWED_SLACK_TEAM_ID");
  });
});
