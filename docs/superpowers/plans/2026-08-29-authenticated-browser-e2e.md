# Authenticated Browser E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立只连接专用测试服务的已登录 Playwright 测试，自动验证员工、两位管理员、任务、内容、文件、审核、发布和权限流程。

**Architecture:** Playwright 使用 Clerk 官方测试工具建立三个独立登录状态；Next.js 在本机运行并连接专用 Clerk Development、Supabase 和 Liveblocks 项目。所有资料带唯一运行编号，测试结束由 Service Role 和 Liveblocks Server API 精确清理，安全检查会在任何写入前拒绝正式环境。

**Tech Stack:** Next.js 16、Playwright 1.62、Clerk Testing、Supabase JS、Liveblocks Node、Vitest、GitHub Actions

**Spec:** `docs/superpowers/specs/2026-08-29-authenticated-browser-e2e-design.md`

## Global Constraints

- Clerk Publishable Key 必须以 `pk_test_` 开头。
- Supabase URL 不得包含正式项目编号 `opjhumwfvasvgzmsiyhu`。
- `E2E_TEST_ENVIRONMENT` 必须严格等于 `dedicated`。
- `SLACK_BOT_TOKEN` 和 Slack 通知频道必须为空。
- 已登录写入测试只允许 `http://127.0.0.1:3000`。
- 三个测试身份固定为一名员工和两名不同管理员。
- 所有测试资料必须带唯一 `e2e-` 运行编号并在结束时清理。
- 不修改或读取正式 Clerk、Supabase、Liveblocks、Vercel 和 Slack 资料。

---

### Task 1: 专用测试环境安全闸门

**Files:**
- Create: `.env.e2e.example`
- Create: `tests/e2e-support/environment.test.ts`
- Create: `tests/e2e/support/environment.ts`
- Create: `tests/e2e/support/check-environment.ts`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `readE2EEnvironment(input: NodeJS.ProcessEnv): E2EEnvironment`
- Produces: `assertDedicatedE2EEnvironment(env: E2EEnvironment): void`
- Produces: `loadE2EEnvironment(): E2EEnvironment`

- [ ] **Step 1: 写安全闸门失败测试**

```ts
import { describe, expect, it } from "vitest";

import {
  assertDedicatedE2EEnvironment,
  readE2EEnvironment,
} from "@/tests/e2e/support/environment";

const safe = {
  E2E_TEST_ENVIRONMENT: "dedicated",
  E2E_BASE_URL: "http://127.0.0.1:3000",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_example",
  CLERK_SECRET_KEY: "sk_test_example",
  NEXT_PUBLIC_SUPABASE_URL: "https://e2e-project.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
  SUPABASE_SERVICE_ROLE_KEY: "service-example",
  NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY: "pk_test_liveblocks",
  LIVEBLOCKS_SECRET_KEY: "sk_test_liveblocks",
  LIVEBLOCKS_WEBHOOK_SECRET: "whsec_test",
  ALLOWED_SLACK_TEAM_ID: "T094DTFCVA8",
  E2E_EMPLOYEE_EMAIL: "employee+clerk_test@linkbridge.test",
  E2E_ADMIN_A_EMAIL: "admin-a+clerk_test@linkbridge.test",
  E2E_ADMIN_B_EMAIL: "admin-b+clerk_test@linkbridge.test",
  E2E_TEST_PASSWORD: "Dedicated-E2E-Only-2026!",
};

describe("dedicated E2E environment", () => {
  it("accepts isolated test services", () => {
    expect(() =>
      assertDedicatedE2EEnvironment(readE2EEnvironment(safe))
    ).not.toThrow();
  });

  it.each([
    ["live Clerk", { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_example" }],
    ["production Supabase", { NEXT_PUBLIC_SUPABASE_URL: "https://opjhumwfvasvgzmsiyhu.supabase.co" }],
    ["Slack token", { SLACK_BOT_TOKEN: "xoxb-not-allowed" }],
    ["remote URL", { E2E_BASE_URL: "https://tasklb.vercel.app" }],
  ])("rejects %s", (_name, unsafe) => {
    expect(() =>
      assertDedicatedE2EEnvironment(
        readE2EEnvironment({ ...safe, ...unsafe })
      )
    ).toThrow(/E2E 安全检查失败/);
  });
});
```

- [ ] **Step 2: 运行测试并确认正确失败**

Run: `pnpm vitest run tests/e2e-support/environment.test.ts`

Expected: FAIL，原因是 `tests/e2e/support/environment.ts` 尚不存在。

- [ ] **Step 3: 实作最小安全闸门**

```ts
import { config } from "dotenv";
import { z } from "zod";

const schema = z.object({
  E2E_TEST_ENVIRONMENT: z.literal("dedicated"),
  E2E_BASE_URL: z.literal("http://127.0.0.1:3000"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith("pk_test_"),
  CLERK_SECRET_KEY: z.string().startsWith("sk_test_"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY: z.string().startsWith("pk_"),
  LIVEBLOCKS_SECRET_KEY: z.string().startsWith("sk_"),
  LIVEBLOCKS_WEBHOOK_SECRET: z.string().min(1),
  ALLOWED_SLACK_TEAM_ID: z.literal("T094DTFCVA8"),
  E2E_EMPLOYEE_EMAIL: z.email(),
  E2E_ADMIN_A_EMAIL: z.email(),
  E2E_ADMIN_B_EMAIL: z.email(),
  E2E_TEST_PASSWORD: z.string().min(12),
  E2E_SUPABASE_DB_URL: z.string().optional(),
  SLACK_BOT_TOKEN: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.string().optional()
  ),
});

export type E2EEnvironment = z.infer<typeof schema>;

export function readE2EEnvironment(input: NodeJS.ProcessEnv) {
  return schema.parse(input);
}

export function assertDedicatedE2EEnvironment(env: E2EEnvironment) {
  const unsafe = [
    env.NEXT_PUBLIC_SUPABASE_URL.includes("opjhumwfvasvgzmsiyhu"),
    Boolean(env.SLACK_BOT_TOKEN?.trim()),
  ];
  if (unsafe.some(Boolean)) throw new Error("E2E 安全检查失败：检测到正式服务或 Slack 设置。");
}

export function loadE2EEnvironment() {
  config({ path: ".env.e2e.local", override: true });
  const env = readE2EEnvironment(process.env);
  assertDedicatedE2EEnvironment(env);
  return env;
}
```

- [ ] **Step 4: 加入依赖、环境模板和忽略规则**

Run: `pnpm add -D @clerk/backend @clerk/testing dotenv tsx`

`.env.e2e.example` 使用以下完整名称，不放真实值，也不建立 `SLACK_BOT_TOKEN`：

```dotenv
E2E_TEST_ENVIRONMENT=dedicated
E2E_BASE_URL=http://127.0.0.1:3000
E2E_SUPABASE_DB_URL=
E2E_EMPLOYEE_EMAIL=employee+clerk_test@linkbridge.test
E2E_ADMIN_A_EMAIL=admin-a+clerk_test@linkbridge.test
E2E_ADMIN_B_EMAIL=admin-b+clerk_test@linkbridge.test
E2E_TEST_PASSWORD=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=
LIVEBLOCKS_SECRET_KEY=
LIVEBLOCKS_WEBHOOK_SECRET=
ALLOWED_SLACK_TEAM_ID=T094DTFCVA8
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
# 安全要求：不要在这个文件加入 SLACK_BOT_TOKEN。
```

`.gitignore` 加入：

```gitignore
playwright/.clerk/
playwright/.runs/
```

`check-environment.ts` 只执行安全检查，不输出任何值：

```ts
import { loadE2EEnvironment } from "./environment";

loadE2EEnvironment();
console.log("dedicated environment ready");
```

`package.json` 加入 `"e2e:check-env": "tsx tests/e2e/support/check-environment.ts"`。

- [ ] **Step 5: 运行测试确认通过**

Run: `pnpm vitest run tests/e2e-support/environment.test.ts`

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add .env.e2e.example .gitignore package.json pnpm-lock.yaml tests/e2e-support/environment.test.ts tests/e2e/support/environment.ts tests/e2e/support/check-environment.ts
git commit -m "test: guard dedicated E2E environment"
```

---

### Task 2: 建立专用 Clerk、Supabase 和 Liveblocks 测试服务

**Files:**
- Create locally only: `.env.e2e.local`
- Uses: `supabase/migrations/202608280001_profiles.sql` through `202608280011_reschedule_content_reminders.sql`

**Interfaces:**
- Consumes: `loadE2EEnvironment()` from Task 1
- Produces: 三个可连接的专用测试服务和本机 E2E 环境变量

- [ ] **Step 1: 在 Clerk Development 实例确认测试密钥**

取得 `pk_test_...` 和 `sk_test_...`，不使用 Production 的 `pk_live_...` 或 `sk_live_...`。

- [ ] **Step 2: 建立独立 Supabase 项目 `Task E2E`**

记录测试项目 URL、Publishable Key、Service Role Key 和数据库连接地址。项目编号必须不是 `opjhumwfvasvgzmsiyhu`。

- [ ] **Step 3: 将现有 migration 套用到测试项目**

Run: `pnpm exec supabase db push --db-url "$E2E_SUPABASE_DB_URL"`

Expected: 11 份 migration 全部成功，`content-files` 私人 bucket 存在。

- [ ] **Step 4: 建立独立 Liveblocks 项目 `Task E2E`**

取得测试 Public Key、Secret Key 和 Webhook Secret，不使用正式 Liveblocks 项目。

- [ ] **Step 5: 建立 `.env.e2e.local` 并运行安全检查**

Run: `pnpm e2e:check-env`

Expected: 只输出 `dedicated environment ready`，不打印任何密钥。

- [ ] **Step 6: 确认测试数据库没有 Slack 设置**

Run against test database:

```sql
select slack_channel_id, slack_channel_name
from notification_settings
where id = true;
```

Expected: 两个值都是 `NULL`，`slack_deliveries` 为 0 条。

---

### Task 3: 三个 Clerk 测试身份和登录状态

**Files:**
- Create: `tests/e2e-support/identities.test.ts`
- Create: `tests/e2e/support/identities.ts`
- Create: `tests/e2e/support/bootstrap.ts`
- Create: `tests/e2e/auth.setup.ts`

**Interfaces:**
- Produces: `buildE2EIdentities(env: E2EEnvironment): readonly E2EIdentity[]`
- Produces: `ensureTestIdentity(client: ClerkClient, identity: E2EIdentity, password: string): Promise<string>`
- Produces: `verifyProfilesAndSeedPlatform(env: E2EEnvironment, identities: readonly E2EIdentity[]): Promise<void>`
- Produces files: `playwright/.clerk/employee.json`, `admin-a.json`, `admin-b.json`

- [ ] **Step 1: 写身份 metadata 失败测试**

```ts
import { describe, expect, it } from "vitest";
import type { E2EEnvironment } from "@/tests/e2e/support/environment";
import { buildE2EIdentities } from "@/tests/e2e/support/identities";

const identities = buildE2EIdentities({
  E2E_EMPLOYEE_EMAIL: "employee+clerk_test@linkbridge.test",
  E2E_ADMIN_A_EMAIL: "admin-a+clerk_test@linkbridge.test",
  E2E_ADMIN_B_EMAIL: "admin-b+clerk_test@linkbridge.test",
} as E2EEnvironment);

describe("E2E identities", () => {
  it("contains one employee and two different admins", () => {
    expect(identities.map((item) => item.role)).toEqual([
      "employee",
      "admin",
      "admin",
    ]);
    expect(new Set(identities.map((item) => item.email)).size).toBe(3);
  });

  it("uses the verified test workspace metadata", () => {
    for (const identity of identities) {
      expect(identity.publicMetadata.slackTeamId).toBe("T094DTFCVA8");
      expect(identity.publicMetadata.slackVerifiedAt).toBeTruthy();
    }
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `pnpm vitest run tests/e2e-support/identities.test.ts`

Expected: FAIL，身份模块不存在。

- [ ] **Step 3: 实作固定身份资料**

身份模块使用以下固定结构；三个账号只从专用测试环境读取，不接受正式账号：

```ts
import type { ClerkClient } from "@clerk/backend";

import type { E2EEnvironment } from "./environment";

export const verifiedAt = "2026-08-29T00:00:00.000Z";

export type E2EIdentity = {
  key: "employee" | "admin-a" | "admin-b";
  email: string;
  displayName: string;
  role: "employee" | "admin";
  storageState: string;
  publicMetadata: ReturnType<typeof metadataFor>;
};

export function metadataFor(role: "employee" | "admin") {
  return {
    role,
    slackTeamId: "T094DTFCVA8",
    slackVerifiedAt: verifiedAt,
  };
}

export function buildE2EIdentities(env: E2EEnvironment): readonly E2EIdentity[] {
  return [
    { key: "employee", email: env.E2E_EMPLOYEE_EMAIL, displayName: "E2E Employee", role: "employee", storageState: "playwright/.clerk/employee.json", publicMetadata: metadataFor("employee") },
    { key: "admin-a", email: env.E2E_ADMIN_A_EMAIL, displayName: "E2E Admin A", role: "admin", storageState: "playwright/.clerk/admin-a.json", publicMetadata: metadataFor("admin") },
    { key: "admin-b", email: env.E2E_ADMIN_B_EMAIL, displayName: "E2E Admin B", role: "admin", storageState: "playwright/.clerk/admin-b.json", publicMetadata: metadataFor("admin") },
  ];
}

export async function ensureTestIdentity(
  client: ClerkClient,
  identity: E2EIdentity,
  password: string
) {
  const found = await client.users.getUserList({ emailAddress: [identity.email] });
  const user = found.data[0] ?? await client.users.createUser({
    emailAddress: [identity.email],
    password,
    firstName: identity.displayName.split(" ")[0],
    lastName: identity.displayName.split(" ").slice(1).join(" "),
    publicMetadata: identity.publicMetadata,
  });
  await client.users.updateUserMetadata(user.id, {
    publicMetadata: identity.publicMetadata,
  });
  return user.id;
}
```

- [ ] **Step 4: 运行身份测试确认通过**

Run: `pnpm vitest run tests/e2e-support/identities.test.ts`

Expected: PASS。

- [ ] **Step 5: 建立 Clerk 登录准备项目**

`auth.setup.ts` 必须串行运行：

```ts
import { createClerkClient } from "@clerk/backend";
import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { test as setup, expect } from "@playwright/test";

import { verifyProfilesAndSeedPlatform } from "./support/bootstrap";
import { loadE2EEnvironment } from "./support/environment";
import { buildE2EIdentities, ensureTestIdentity } from "./support/identities";

const env = loadE2EEnvironment();
const identities = buildE2EIdentities(env);
const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

setup.describe.configure({ mode: "serial" });

setup("configure Clerk testing", async () => {
  await clerkSetup();
  for (const identity of identities) {
    await ensureTestIdentity(clerkClient, identity, env.E2E_TEST_PASSWORD);
  }
});

for (const identity of identities) {
  setup(`sign in ${identity.key}`, async ({ page }) => {
    await page.goto("/login");
    await clerk.signIn({
      page,
      signInParams: {
        strategy: "password",
        identifier: identity.email,
        password: env.E2E_TEST_PASSWORD,
      },
    });
    await page.goto("/tasks");
    await expect(page).toHaveURL(/\/tasks$/);
    await page.context().storageState({ path: identity.storageState });
  });
}

setup("verify profiles and seed shared platform", async () => {
  await verifyProfilesAndSeedPlatform(env, identities);
});
```

`bootstrap.ts` 使用测试 Supabase Service Role 查询三个 `profiles`，逐一核对 Clerk user id、显示名称和角色；然后执行平台 upsert：

```ts
await supabase.from("platforms").upsert(
  { name: "E2E 测试平台", color: "#64748b", archived_at: null },
  { onConflict: "name" }
);
await supabase.from("notification_settings").update({
  slack_channel_id: null,
  slack_channel_name: null,
}).eq("id", true);
```

任何 profile 不存在或角色不符时抛出 `E2E_PROFILE_SYNC_FAILED:<email>`，平台或通知设置失败时抛出 Supabase 返回的原始错误文字。

- [ ] **Step 6: 提交**

```bash
git add tests/e2e-support/identities.test.ts tests/e2e/support/identities.ts tests/e2e/support/bootstrap.ts tests/e2e/auth.setup.ts
git commit -m "test: prepare Clerk E2E identities"
```

---

### Task 4: Playwright 项目和安全清理器

**Files:**
- Create: `tests/e2e-support/run-context.test.ts`
- Create: `tests/e2e/support/run-context.ts`
- Create: `tests/e2e/support/cleanup.ts`
- Create: `tests/e2e/support/datetime.ts`
- Create: `tests/e2e/support/drag.ts`
- Create: `tests/e2e/auth.cleanup.ts`
- Modify: `playwright.config.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `createRunContext(): E2ERunContext`
- Produces: `saveRunContext(context): Promise<void>`
- Produces: `cleanupRun(context): Promise<void>`
- Produces: `malaysiaDateTimeMinutesFromNow(minutes: number): string`
- Produces: `dragWithPointer(page: Page, source: Locator, target: Locator): Promise<void>`

- [ ] **Step 1: 写运行编号和清理范围失败测试**

```ts
import { describe, expect, it } from "vitest";
import { assertE2ETitle, createRunContext } from "@/tests/e2e/support/run-context";

describe("E2E run context", () => {
  it("creates an isolated e2e prefix", () => {
    expect(createRunContext().runId).toMatch(/^e2e-\d{8}-\d{6}-[a-f0-9]{6}$/);
  });

  it("refuses cleanup for a normal title", () => {
    expect(() => assertE2ETitle("正式任务")).toThrow(/拒绝清理/);
  });
});
```

- [ ] **Step 2: 运行并确认失败**

Run: `pnpm vitest run tests/e2e-support/run-context.test.ts`

Expected: FAIL，运行资料模块不存在。

- [ ] **Step 3: 实作运行资料和清理器**

运行资料保存 `runId`、`taskIds`、`contentIds`、`storagePaths`、`liveblocksRoomIds`。清理器先调用 Task 1 的安全闸门，再查询每个 task/content ID 的标题；标题不是 `[${runId}]` 开头时立即拒绝删除。数据库删除顺序固定如下：

1. Supabase Storage objects；
2. `slack_deliveries` 和相关 `audit_events`；
3. `inline_comment_events`、`content_version_attachments`、`content_approvals`、`content_review_events`；
4. 解除 `contents.linked_task_id` 与 `tasks.linked_content_id`；
5. `task_comments`、测试 tasks、测试 contents；
6. Liveblocks `deleteRoom(roomId)`；
7. 本机运行资料与三个 storageState 文件。

核心实现必须逐次检查 Supabase `error`，不能用不等待的 Promise：

```ts
export async function cleanupRun(context: E2ERunContext) {
  const env = loadE2EEnvironment();
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  await assertOwnedRecords(supabase, context);
  if (context.storagePaths.length) {
    assertNoError(await supabase.storage.from("content-files").remove(context.storagePaths));
  }
  await deleteWhereIn(supabase, "slack_deliveries", "content_id", context.contentIds);
  await deleteAuditEvents(supabase, [...context.taskIds, ...context.contentIds]);
  await deleteWhereIn(supabase, "inline_comment_events", "room_id", context.liveblocksRoomIds);
  await deleteContentVersionAttachments(supabase, context.contentIds);
  await deleteWhereIn(supabase, "content_approvals", "content_id", context.contentIds);
  await deleteWhereIn(supabase, "content_review_events", "content_id", context.contentIds);
  await nullContentTaskLinks(supabase, context.contentIds, context.taskIds);
  await deleteWhereIn(supabase, "task_comments", "task_id", context.taskIds);
  await deleteWhereIn(supabase, "tasks", "id", context.taskIds);
  await deleteWhereIn(supabase, "contents", "id", context.contentIds);
  const liveblocks = new Liveblocks({ secret: env.LIVEBLOCKS_SECRET_KEY });
  for (const roomId of context.liveblocksRoomIds) await liveblocks.deleteRoom(roomId);
  await assertRunRemoved(supabase, context);
  await removeLocalRunFiles(context);
}
```

清理后再次查询同一组 ID；任何残留都会抛出 `E2E_CLEANUP_INCOMPLETE`。

日期 helper 返回 `datetime-local` 要的马来西亚时间；拖动 helper 使用真实指针事件，适配 dnd-kit：

```ts
export function malaysiaDateTimeMinutesFromNow(minutes: number) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(Date.now() + minutes * 60_000)).replace(" ", "T");
}

export async function dragWithPointer(page: Page, source: Locator, target: Locator) {
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error("E2E_DRAG_TARGET_NOT_VISIBLE");
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + 80, { steps: 12 });
  await page.mouse.up();
}
```

- [ ] **Step 4: 修改 Playwright 项目**

`playwright.config.ts` 顶部载入 `.env.e2e.local`，项目固定为：

```ts
projects: [
  {
    name: "anonymous",
    testMatch: ["login.spec.ts", "tasks.spec.ts", "content-review.spec.ts"],
  },
  {
    name: "auth-setup",
    testMatch: "auth.setup.ts",
    teardown: "auth-cleanup",
  },
  {
    name: "authenticated",
    testMatch: "authenticated-*.spec.ts",
    dependencies: ["auth-setup"],
    use: { ...devices["Desktop Chrome"] },
  },
  {
    name: "auth-cleanup",
    testMatch: "auth.cleanup.ts",
  },
]
```

已登录项目强制一个 worker。新增 scripts：

```json
{
  "test:e2e:anonymous": "playwright test --project=anonymous",
  "test:e2e:authenticated": "playwright test --project=authenticated",
  "test:e2e:all": "playwright test"
}
```

- [ ] **Step 5: 运行单元测试确认通过**

Run: `pnpm vitest run tests/e2e-support/run-context.test.ts`

Expected: PASS。

- [ ] **Step 6: 提交**

```bash
git add playwright.config.ts package.json tests/e2e-support/run-context.test.ts tests/e2e/support/run-context.ts tests/e2e/support/cleanup.ts tests/e2e/support/datetime.ts tests/e2e/support/drag.ts tests/e2e/auth.cleanup.ts
git commit -m "test: isolate and clean E2E runs"
```

---

### Task 5: 员工管理员限制和正确拒绝原因

**Files:**
- Create: `tests/e2e/authenticated-permissions.spec.ts`
- Modify: `tests/app/access-denied.test.tsx`
- Modify: `app/access-denied/page.tsx`
- Modify: `app/(protected)/admin/history/page.tsx`
- Modify: `app/(protected)/admin/settings/page.tsx`

**Interfaces:**
- Consumes: employee/admin storageState from Task 3
- Produces: `/access-denied?reason=admin` 的正确中文提示

- [ ] **Step 1: 先写权限提示失败测试**

```tsx
it("explains that an employee needs administrator permission", async () => {
  const page = await AccessDeniedPage({
    searchParams: Promise.resolve({ reason: "admin" }),
  });
  render(page);
  expect(screen.getByText("需要管理员权限")).toBeInTheDocument();
  expect(screen.queryByText("Slack Workspace 不符合")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: 运行并确认正确失败**

Run: `pnpm vitest run tests/app/access-denied.test.tsx`

Expected: FAIL，页面仍只显示 Workspace 错误。

- [ ] **Step 3: 最小修复拒绝原因**

管理员页面将员工带到 `/access-denied?reason=admin`。拒绝页根据 `reason` 显示：

- `admin`：标题 `需要管理员权限`，说明 `这个页面只开放给管理员。`；
- 其他值：保留现有 Workspace 不符合说明。

- [ ] **Step 4: 运行单元测试确认通过**

Run: `pnpm vitest run tests/app/access-denied.test.tsx tests/components/admin-only.test.tsx`

Expected: PASS。

- [ ] **Step 5: 写已登录员工与管理员浏览器测试**

员工 context 断言任务、内容排期可见，管理员设置和历史记录链接不可见；直接打开两个管理员 URL 都显示 `需要管理员权限`。管理员 A context 断言两个管理员页面都能打开：

```ts
test("permissions: employee is blocked and admin is allowed", async ({ browser }) => {
  const employee = await browser.newContext({ storageState: EMPLOYEE_STATE });
  const employeePage = await employee.newPage();
  await employeePage.goto("/tasks");
  await expect(employeePage.getByRole("link", { name: "任务" })).toBeVisible();
  await expect(employeePage.getByRole("link", { name: "内容排期" })).toBeVisible();
  await expect(employeePage.getByRole("link", { name: "管理员设置" })).toHaveCount(0);
  await expect(employeePage.getByRole("link", { name: "历史记录" })).toHaveCount(0);
  for (const path of ["/admin/settings", "/admin/history"]) {
    await employeePage.goto(path);
    await expect(employeePage.getByRole("heading", { name: "需要管理员权限" })).toBeVisible();
  }
  await employee.close();

  const admin = await browser.newContext({ storageState: ADMIN_A_STATE });
  const adminPage = await admin.newPage();
  await adminPage.goto("/admin/settings");
  await expect(adminPage.getByRole("heading", { name: "系统设置" })).toBeVisible();
  await expect(adminPage.getByRole("heading", { name: "发布平台" })).toBeVisible();
  await adminPage.goto("/admin/history");
  await expect(adminPage.getByRole("heading", { name: "系统历史" })).toBeVisible();
  await admin.close();
});
```

- [ ] **Step 6: 运行浏览器测试**

Run: `pnpm test:e2e:authenticated --grep "permissions"`

Expected: PASS。

- [ ] **Step 7: 提交**

```bash
git add app/access-denied/page.tsx app/'(protected)'/admin/history/page.tsx app/'(protected)'/admin/settings/page.tsx tests/app/access-denied.test.tsx tests/e2e/authenticated-permissions.spec.ts
git commit -m "test: verify employee admin restrictions"
```

---

### Task 6: 普通任务完整浏览器流程

**Files:**
- Create: `tests/e2e/authenticated-tasks.spec.ts`

**Interfaces:**
- Consumes: employee storageState and run context
- Produces: one task ID recorded for cleanup

- [ ] **Step 1: 写浏览器测试并先观察失败**

测试必须使用真实页面控件：

```ts
test("employee creates, comments on, and completes a task", async ({ browser }) => {
  const context = await browser.newContext({ storageState: EMPLOYEE_STATE });
  const page = await context.newPage();
  const title = `[${run.runId}] 普通任务`;

  await page.goto("/tasks");
  await page.getByRole("button", { name: "新增任务" }).click();
  await page.getByLabel("标题").fill(title);
  await page.getByLabel("说明").fill("浏览器自动测试任务");
  await page.getByLabel("负责人").selectOption({ label: "E2E Employee" });
  await page.getByLabel("优先级").selectOption("urgent");
  await page.getByLabel("完成时间").fill(malaysiaDateTimeMinutesFromNow(60));
  await page.getByRole("button", { name: "保存任务" }).click();
  await expect(page.getByRole("link", { name: title })).toBeVisible();

  const card = page.getByRole("article").filter({ hasText: title });
  await dragWithPointer(
    page,
    card.getByRole("button", { name: `拖动 ${title}` }),
    page.getByRole("region", { name: "正在做" })
  );
  await expect(page.getByRole("region", { name: "正在做" })).toContainText(title);

  await page.getByRole("link", { name: title }).click();
  await page.getByLabel("写留言").fill(`留言 ${run.runId}`);
  await page.getByRole("button", { name: "留言" }).click();
  await expect(page.getByText(`留言 ${run.runId}`)).toBeVisible();
});
```

再回到看板，把同一任务拖到 `已经完成`，重新载入并确认仍在该栏。

- [ ] **Step 2: 运行并确认最初失败原因**

Run: `pnpm test:e2e:authenticated --grep "creates, comments"`

Expected: 首次在尚未完成的身份/运行资料支援处失败，而不是语法错误。

- [ ] **Step 3: 记录新任务编号供清理器使用**

保存任务后马上从链接读取 UUID，先存运行资料再继续拖动，保证后面的断言失败时清理器仍知道目标：

```ts
const href = await page.getByRole("link", { name: title }).getAttribute("href");
const taskId = href?.match(/^\/tasks\/([0-9a-f-]{36})$/)?.[1];
if (!taskId) throw new Error("E2E_TASK_ID_NOT_FOUND");
run.taskIds.push(taskId);
await saveRunContext(run);
```

- [ ] **Step 4: 运行确认通过**

Run: `pnpm test:e2e:authenticated --grep "creates, comments"`

Expected: PASS；重载后任务与留言存在。

- [ ] **Step 5: 提交**

```bash
git add tests/e2e/authenticated-tasks.spec.ts
git commit -m "test: cover authenticated task workflow"
```

---

### Task 7: 内容、文件、两人审核和发布完整流程

**Files:**
- Create: `tests/e2e/fixtures/e2e-attachment.pdf`
- Create: `tests/e2e/authenticated-content.spec.ts`

**Interfaces:**
- Consumes: all three storageState files and run context
- Produces: content ID, linked publish task ID, attachment path and Liveblocks room ID for cleanup

- [ ] **Step 1: 建立最小 PDF 测试附件**

文件名固定为 `e2e-attachment.pdf`，内容包含 `JUYU E2E attachment`。测试以 SHA-256 比较上传前和下载后的字节。

- [ ] **Step 2: 写员工建立内容的失败测试**

员工页面操作：

1. 打开 `/content/new`；
2. 标题填 `[runId] 排期内容`；
3. 勾选 `E2E 测试平台`；
4. 负责人选择 `E2E Employee`；
5. 发布时间填当前时间前五分钟；
6. 建立后记录 URL 中的 content UUID；
7. 打开 `/tasks`，找到 `发布 [title] 内容`，断言卡片显示 `由内容排期控制，不能手动拖动` 且没有拖动按钮；
8. 回到内容页，在 `data-testid=content-editor` 的 BlockNote contenteditable 输入 `正文 runId`；
9. 等待 `已经同步`；
10. 上传 PDF 并等待 `文件已经上传。`；
11. 点击附件，保存下载并比较 SHA-256；
12. 点击 `交给上司检查`。

Run: `pnpm test:e2e:authenticated --grep "creates scheduled content"`

Expected: 在测试环境资料或未完成流程处失败。

- [ ] **Step 3: 完成员工送审断言**

送审后断言：状态为 `等待审核`、正文显示固定版本、上传按钮消失、批准进度为 `0/2`。员工在固定版本选中 `正文 runId`，通过 Liveblocks 浮动留言按钮新增 `送审后留言 runId`，再在 `指定文字留言` 面板确认该留言出现，以证明正文锁定后仍可留言。

- [ ] **Step 4: 写两位管理员审核流程**

使用新的 browser context 依次执行：

- 管理员 A：点击 `批准内容`，看到 `你已经批准，正在等待另一位管理员。`；
- 管理员 B：填写 `需要修改的地方` 并点击 `要求修改`；
- 员工：确认 `需要修改`，修改正文，等待同步，再点 `交给上司检查`；
- 管理员 A：批准新版；
- 管理员 B：批准新版；
- 最后页面显示 `已经批准` 或因时间已到显示 `等待发布`。

- [ ] **Step 5: 写确认发布和历史断言**

员工点击 `确认已经发布`，断言：

- 内容显示 `已经发布`；
- `/tasks` 内对应 `发布 [title] 内容` 位于 `已经完成`；
- 内容页的 `修改与审核记录` 显示送审、批准、退回、重新送审和发布；
- 管理员 `/admin/history` 找到本次内容的送审、批准、退回、重新送审和发布记录；
- 测试 Supabase 的 `slack_deliveries` 数量仍为 0。

- [ ] **Step 6: 运行完整内容流程**

Run: `pnpm test:e2e:authenticated --grep "scheduled content|review|published"`

Expected: PASS；清理项目随后删除内容、附件、任务和 Liveblocks room。

- [ ] **Step 7: 提交**

```bash
git add tests/e2e/fixtures/e2e-attachment.pdf tests/e2e/authenticated-content.spec.ts
git commit -m "test: cover authenticated content workflow"
```

---

### Task 8: GitHub Actions 与最终验收

**Files:**
- Create: `.github/workflows/authenticated-e2e.yml`
- Modify: `README.md`
- Modify: `docs/completion-task-table.md`

**Interfaces:**
- Consumes: GitHub Actions Secrets for dedicated test services
- Produces: repeatable CI result and Playwright evidence artifacts

- [ ] **Step 1: 建立 CI workflow**

Workflow 只在手动触发和 `main` pull request 上运行，`concurrency` 固定为 `task-e2e-dedicated`，不允许两个写入测试同时执行。主要命令：

```yaml
- run: pnpm install --frozen-lockfile
- run: pnpm exec playwright install --with-deps chromium
- run: pnpm exec supabase db push --db-url "$E2E_SUPABASE_DB_URL"
- run: pnpm test:e2e:all
- if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-evidence
    path: |
      playwright-report/
      test-results/
    retention-days: 7
```

Workflow 环境只引用 `E2E_*`、测试 Clerk、测试 Supabase 和测试 Liveblocks Secrets，不提供 Slack Secret。

```yaml
env:
  E2E_TEST_ENVIRONMENT: dedicated
  E2E_BASE_URL: http://127.0.0.1:3000
  E2E_SUPABASE_DB_URL: ${{ secrets.E2E_SUPABASE_DB_URL }}
  E2E_EMPLOYEE_EMAIL: ${{ secrets.E2E_EMPLOYEE_EMAIL }}
  E2E_ADMIN_A_EMAIL: ${{ secrets.E2E_ADMIN_A_EMAIL }}
  E2E_ADMIN_B_EMAIL: ${{ secrets.E2E_ADMIN_B_EMAIL }}
  E2E_TEST_PASSWORD: ${{ secrets.E2E_TEST_PASSWORD }}
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.E2E_CLERK_PUBLISHABLE_KEY }}
  CLERK_SECRET_KEY: ${{ secrets.E2E_CLERK_SECRET_KEY }}
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.E2E_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.E2E_SUPABASE_PUBLISHABLE_KEY }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.E2E_SUPABASE_SERVICE_ROLE_KEY }}
  NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY: ${{ secrets.E2E_LIVEBLOCKS_PUBLIC_KEY }}
  LIVEBLOCKS_SECRET_KEY: ${{ secrets.E2E_LIVEBLOCKS_SECRET_KEY }}
  LIVEBLOCKS_WEBHOOK_SECRET: ${{ secrets.E2E_LIVEBLOCKS_WEBHOOK_SECRET }}
  ALLOWED_SLACK_TEAM_ID: T094DTFCVA8
  NEXT_PUBLIC_APP_URL: http://127.0.0.1:3000
```

- [ ] **Step 2: 在 GitHub 加入专用测试 Secrets**

加入上方列出的 13 个 GitHub Secrets。逐项确认 Clerk key 为 test、Supabase project ref 不是正式编号、Liveblocks 为 `Task E2E`；仓库 Secrets 内不得出现 `SLACK_BOT_TOKEN`。

- [ ] **Step 3: 运行所有本机验证**

```bash
pnpm test
pnpm lint
pnpm build
pnpm test:e2e:all
```

Expected:

- Vitest 0 个失败；
- ESLint 0 error；
- Next build exit 0；
- anonymous、auth-setup、authenticated、auth-cleanup 全部通过；
- `slack_deliveries` 为 0；
- 清理后没有本次 runId 资料。

- [ ] **Step 4: 手动触发 GitHub Actions 一次**

Expected: workflow 成功，trace artifact 可下载，专用测试数据库清理完成。

- [ ] **Step 5: 更新白话文档**

README 加入如何复制 `.env.e2e.example`、怎样运行匿名或已登录测试、为什么正式环境会被拒绝。任务表第 23 项只有在本机和 GitHub Actions 都成功后才改为 `完成`。

- [ ] **Step 6: 最终提交**

```bash
git add .github/workflows/authenticated-e2e.yml README.md docs/completion-task-table.md
git commit -m "ci: run authenticated browser acceptance tests"
```

- [ ] **Step 7: 最终检查和上传**

Run: `git diff --check && git status --short`

Expected: 只有用户原有的 `audits/` 未跟踪资料，不包含测试秘密或 storageState。然后推送实现分支并合并到 `main`。
