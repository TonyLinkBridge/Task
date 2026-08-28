import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware:
    (handler: unknown) =>
      handler,
}));

import proxy from "@/proxy";

type ProxyHandler = (
  auth: () => Promise<{ userId: string | null }>,
  request: {
    nextUrl: { pathname: string };
    url: string;
  }
) => Promise<Response | undefined>;

describe("proxy public routes", () => {
  it("allows Liveblocks to call the webhook without a Clerk login", async () => {
    const response = await (proxy as unknown as ProxyHandler)(
      async () => ({ userId: null }),
      {
        nextUrl: { pathname: "/api/liveblocks-webhook" },
        url: "https://tasklb.vercel.app/api/liveblocks-webhook",
      }
    );

    expect(response).toBeUndefined();
  });
});
