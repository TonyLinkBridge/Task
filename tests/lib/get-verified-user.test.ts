import { describe, expect, it } from "vitest";

import {
  resolveVerifiedUser,
  type ResolveVerifiedUserDependencies,
} from "@/lib/auth/resolve-verified-user";
import type { ClerkUserSnapshot, ProfileInput } from "@/lib/auth/types";

const baseUser: ClerkUserSnapshot = {
  id: "user_employee",
  firstName: "Jamie",
  lastName: "Tan",
  username: "jamie",
  imageUrl: "https://example.com/jamie.png",
  publicMetadata: {},
};

function createDependencies(
  user: ClerkUserSnapshot,
  events: string[]
): ResolveVerifiedUserDependencies {
  return {
    userId: user.id,
    allowedSlackTeamId: "T094DTFCVA8",
    now: () => new Date("2026-08-27T06:18:15.954Z"),
    getUser: async () => user,
    getSlackAccessToken: async () => {
      events.push("requested-slack-token");
      return "access-token";
    },
    getSlackTeamId: async () => {
      events.push("checked-slack-team");
      return "T094DTFCVA8";
    },
    updatePublicMetadata: async (_userId, metadata) => {
      events.push(`updated:${JSON.stringify(metadata)}`);
    },
    upsertProfile: async (profile: ProfileInput) => {
      events.push(`profile:${JSON.stringify(profile)}`);
    },
  };
}

describe("resolveVerifiedUser", () => {
  it("verifies a new user and assigns the employee role", async () => {
    const events: string[] = [];

    const result = await resolveVerifiedUser(
      createDependencies(baseUser, events)
    );

    expect(result).toEqual({
      id: "user_employee",
      role: "employee",
      name: "Jamie Tan",
      imageUrl: "https://example.com/jamie.png",
    });
    expect(events).toContain("requested-slack-token");
    expect(events).toContain("checked-slack-team");
    expect(events).toContain(
      'updated:{"role":"employee","slackTeamId":"T094DTFCVA8","slackVerifiedAt":"2026-08-27T06:18:15.954Z"}'
    );
  });

  it("does not verify the Slack workspace again after the first success", async () => {
    const events: string[] = [];
    const verifiedAdmin: ClerkUserSnapshot = {
      ...baseUser,
      id: "user_admin",
      publicMetadata: {
        role: "admin",
        slackTeamId: "T094DTFCVA8",
        slackVerifiedAt: "2026-08-20T01:02:03.000Z",
      },
    };

    const result = await resolveVerifiedUser(
      createDependencies(verifiedAdmin, events)
    );

    expect(result.role).toBe("admin");
    expect(events).not.toContain("requested-slack-token");
    expect(events).not.toContain("checked-slack-team");
  });

  it("rejects a user from another workspace", async () => {
    const events: string[] = [];
    const dependencies = createDependencies(baseUser, events);
    dependencies.getSlackTeamId = async () => "T000OTHER";

    await expect(resolveVerifiedUser(dependencies)).rejects.toThrow(
      "WRONG_SLACK_WORKSPACE"
    );
    expect(events.some((event) => event.startsWith("updated:"))).toBe(false);
    expect(events.some((event) => event.startsWith("profile:"))).toBe(false);
  });

  it("rejects an unauthenticated request", async () => {
    const events: string[] = [];
    const dependencies = createDependencies(baseUser, events);
    dependencies.userId = null;

    await expect(resolveVerifiedUser(dependencies)).rejects.toThrow(
      "UNAUTHENTICATED"
    );
  });
});
