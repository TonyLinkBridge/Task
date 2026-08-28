import { expect, test } from "@playwright/test";

test("content review pages stay private for signed-out visitors", async ({ request }) => {
  const response = await request.get(
    "/content/22222222-2222-4222-8222-222222222222",
    { maxRedirects: 0 }
  );

  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe(
    "/login?redirect=%2Fcontent%2F22222222-2222-4222-8222-222222222222"
  );
});

test("new content pages stay private for signed-out visitors", async ({ request }) => {
  const response = await request.get("/content/new", { maxRedirects: 0 });

  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe("/login?redirect=%2Fcontent%2Fnew");
});
