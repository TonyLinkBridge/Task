import { expect, test } from "@playwright/test";

test("help center pages stay private for signed-out visitors", async ({ request }) => {
  for (const path of [
    "/help",
    "/help/search?q=审核",
    "/help/内容审核/提交审核",
    "/help/内容审核/提交审核/pdf",
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });

    expect(response.status()).toBe(307);
    const location = new URL(response.headers().location!, "http://127.0.0.1:3000");
    expect(location.pathname).toBe("/login");
    expect(decodeURIComponent(location.searchParams.get("redirect")!)).toBe(path);
  }
});
