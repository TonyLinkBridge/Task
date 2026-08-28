import { describe, expect, it } from "vitest";

import {
  assertAllowedSlackTeam,
  fetchSlackTeamId,
} from "@/lib/auth/slack-workspace";

describe("Slack workspace verification", () => {
  it("accepts the designated workspace", () => {
    expect(() =>
      assertAllowedSlackTeam("T094DTFCVA8", "T094DTFCVA8")
    ).not.toThrow();
  });

  it("rejects another workspace", () => {
    expect(() =>
      assertAllowedSlackTeam("T000OTHER", "T094DTFCVA8")
    ).toThrow("WRONG_SLACK_WORKSPACE");
  });

  it("reads the team id from Slack OpenID user info", async () => {
    const fakeFetch: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          ok: true,
          sub: "U123",
          "https://slack.com/user_id": "U123",
          "https://slack.com/team_id": "T094DTFCVA8",
          email: "employee@example.com",
          email_verified: true,
          name: "Employee",
          picture: "https://example.com/avatar.png",
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );

    await expect(fetchSlackTeamId("access-token", fakeFetch)).resolves.toBe(
      "T094DTFCVA8"
    );
  });

  it("rejects an unsuccessful Slack response", async () => {
    const fakeFetch: typeof fetch = async () =>
      new Response(JSON.stringify({ ok: false, error: "invalid_auth" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });

    await expect(fetchSlackTeamId("bad-token", fakeFetch)).rejects.toThrow(
      "SLACK_IDENTITY_LOOKUP_FAILED"
    );
  });
});
