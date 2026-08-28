import { describe, expect, it, vi } from "vitest";

const { clerkMiddlewareMock } = vi.hoisted(() => ({
  clerkMiddlewareMock: vi.fn((handler: unknown) => handler),
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: clerkMiddlewareMock,
}));

import proxy, { config } from "@/proxy";

type ProxyHandler = (
  auth: () => Promise<{ userId: string | null }>,
  request: {
    nextUrl: { pathname: string };
    url: string;
  }
) => Promise<Response | undefined>;

describe("proxy public routes", () => {
  it("enables the Clerk frontend API proxy", () => {
    expect(clerkMiddlewareMock).toHaveBeenCalledWith(
      expect.any(Function),
      { frontendApiProxy: { enabled: true } }
    );
  });

  it("runs the middleware for Clerk frontend API assets", () => {
    expect(config.matcher).toContain("/__clerk/(.*)");
  });

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
