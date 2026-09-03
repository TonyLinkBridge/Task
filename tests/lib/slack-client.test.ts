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

  it("posts a message to the selected channel", async () => {
    let request: { url: string; method?: string; body?: string } | undefined;
    const client = makeSlackClient({
      token: "xoxb-test",
      fetch: async (url, init) => {
        request = {
          url: String(url),
          method: init?.method,
          body: typeof init?.body === "string" ? init.body : undefined,
        };
        return new Response(JSON.stringify({ ok: true, ts: "1724832000.000100" }));
      },
    });

    await expect(
      client.postMessage({
        channel: "G001",
        text: "内容已经送审",
        blocks: [{ type: "section", text: { type: "mrkdwn", text: "*测试内容*" } }],
      })
    ).resolves.toEqual({ timestamp: "1724832000.000100" });

    expect(request).toEqual({
      url: "https://slack.com/api/chat.postMessage",
      method: "POST",
      body: JSON.stringify({
        channel: "G001",
        text: "内容已经送审",
        blocks: [{ type: "section", text: { type: "mrkdwn", text: "*测试内容*" } }],
      }),
    });
  });
});
