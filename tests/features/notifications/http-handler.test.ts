import { describe, expect, it } from "vitest";

import { makeQueueHttpHandler } from "@/supabase/functions/_shared/http-handler";

describe("Slack queue HTTP handler", () => {
  it("rejects calls without the configured secret", async () => {
    let ran = false;
    const handler = makeQueueHttpHandler({
      secret: "edge-secret",
      run: async () => {
        ran = true;
        return { claimed: 0, sent: 0, failed: 0 };
      },
    });

    const response = await handler(
      new Request("https://example.test", { method: "POST" })
    );

    expect(response.status).toBe(401);
    expect(ran).toBe(false);
  });

  it("returns the queue summary for an authorized call", async () => {
    const handler = makeQueueHttpHandler({
      secret: "edge-secret",
      run: async () => ({ claimed: 2, sent: 1, failed: 1 }),
    });

    const response = await handler(
      new Request("https://example.test", {
        method: "POST",
        headers: { "x-edge-secret": "edge-secret" },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      claimed: 2,
      sent: 1,
      failed: 1,
    });
  });

  it("does not expose secret error details", async () => {
    const handler = makeQueueHttpHandler({
      secret: "edge-secret",
      run: async () => {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY=do-not-leak");
      },
    });

    const response = await handler(
      new Request("https://example.test", {
        method: "POST",
        headers: { "x-edge-secret": "edge-secret" },
      })
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: "队列处理失败",
    });
  });
});
