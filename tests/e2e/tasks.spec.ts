import { expect, test } from "@playwright/test";

test("task details stay private for signed-out visitors", async ({ request }) => {
  const response = await request.get(
    "/tasks/11111111-1111-4111-8111-111111111111",
    { maxRedirects: 0 }
  );

  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe(
    "/login?redirect=%2Ftasks%2F11111111-1111-4111-8111-111111111111"
  );
});
