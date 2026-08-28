import { expect, test } from "@playwright/test";

test("anonymous visitors are sent to the Slack login page", async ({ request }) => {
  const response = await request.get("/tasks?view=board", {
    maxRedirects: 0,
  });

  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe(
    "/login?redirect=%2Ftasks%3Fview%3Dboard"
  );
});
