import { describe, expect, it } from "vitest";

import { contentInputSchema } from "@/features/content/schema";

const validInput = {
  title: "明天要发布的内容",
  platformIds: ["11111111-1111-4111-8111-111111111111"],
  publishAt: "2026-08-29T02:00:00.000Z",
  assigneeId: "user_employee",
};

describe("contentInputSchema", () => {
  it("accepts a complete content schedule", () => {
    expect(contentInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("requires at least one platform", () => {
    expect(
      contentInputSchema.safeParse({ ...validInput, platformIds: [] }).success
    ).toBe(false);
  });

  it("removes duplicate platforms", () => {
    const result = contentInputSchema.parse({
      ...validInput,
      platformIds: [validInput.platformIds[0], validInput.platformIds[0]],
    });

    expect(result.platformIds).toEqual(validInput.platformIds);
  });

  it("rejects an invalid publishing time", () => {
    expect(
      contentInputSchema.safeParse({ ...validInput, publishAt: "tomorrow" })
        .success
    ).toBe(false);
  });
});
