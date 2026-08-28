import { describe, expect, it } from "vitest";

import { makeLiveblocksUsersHandler } from "@/features/content/api/liveblocks-users-handler";

describe("POST /api/liveblocks-users", () => {
  it("returns member names in the same order requested by comments", async () => {
    const handler = makeLiveblocksUsersHandler({
      getVerifiedUser: async () => ({
        id: "user_employee",
        role: "employee",
        name: "Employee",
        imageUrl: null,
      }),
      listUsers: async () => [
        {
          id: "user_admin",
          name: "上司",
          avatar: "",
          role: "admin",
          color: "#2563eb",
        },
        {
          id: "user_employee",
          name: "员工",
          avatar: "",
          role: "employee",
          color: "#059669",
        },
      ],
    });

    const response = await handler(
      new Request("http://localhost/api/liveblocks-users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userIds: ["user_employee", "user_admin"] }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject([
      { name: "员工", role: "employee" },
      { name: "上司", role: "admin" },
    ]);
  });
});
