import { describe, expect, it } from "vitest";

import { makeSlackClient } from "@/lib/slack/client";

describe("Slack client", () => {
  it("lists public channels and private channels joined by the app", async () => {
    const requestedUrls: string[] = [];
    const client = makeSlackClient({
      token: "xoxb-test",
      fetch: async (url) => {
        requestedUrls.push(String(url));
        return new Response(
          JSON.stringify({
            ok: true,
            channels: [
              { id: "C001", name: "general", is_private: false, is_member: false },
              { id: "G001", name: "content", is_private: true, is_member: true },
              { id: "G002", name: "secret", is_private: true, is_member: false },
            ],
            response_metadata: { next_cursor: "" },
          })
        );
      },
    });

    await expect(client.listAllowedChannels()).resolves.toEqual([
      { id: "G001", name: "content", isPrivate: true },
      { id: "C001", name: "general", isPrivate: false },
    ]);
    expect(requestedUrls[0]).toContain("types=public_channel%2Cprivate_channel");
  });

  it("rejects a private channel that the app has not joined", async () => {
    const client = makeSlackClient({
      token: "xoxb-test",
      fetch: async () =>
        new Response(
          JSON.stringify({
            ok: true,
            channel: {
              id: "G002",
              name: "secret",
              is_private: true,
              is_member: false,
            },
          })
        ),
    });

    await expect(client.getAllowedChannel("G002")).rejects.toThrow(
      "SLACK_APP_NOT_IN_CHANNEL"
    );
  });
});
