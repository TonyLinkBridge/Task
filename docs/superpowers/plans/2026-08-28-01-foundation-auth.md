# 第一阶段：项目基础与登录 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可运行的 Square UI Base UI 项目，并完成只允许指定 Slack Workspace 第一次注册的 Clerk 登录。

**Architecture:** Next.js 负责页面和所有后台入口。Clerk 负责 Slack 登录与角色；Supabase 只保存应用资料，不启用 Supabase Auth。第一次登录会向 Slack 读取真实 Team ID，通过后把验证时间和默认角色写入 Clerk，之后不重复验证 Workspace。

**Tech Stack:** Next.js 16、React 19、TypeScript、Base UI、Clerk、Supabase Postgres、Vitest、Testing Library、Playwright、pnpm

**Spec:** `docs/superpowers/specs/2026-08-28-internal-task-content-scheduling-design.md`

## Global Constraints

- 指定 Workspace ID 使用环境变量 `ALLOWED_SLACK_TEAM_ID`，正式值为 `T094DTFCVA8`。
- 新用户固定写入 `role: "employee"`；管理员只在 Clerk Dashboard 手动提升。
- 已有 `slackVerifiedAt` 的用户以后登录不再调用 Slack 验证接口。
- 所有受保护页面和后台动作都调用同一个 `getVerifiedUser()`。
- 所有显示时间使用 `Asia/Kuala_Lumpur`。
- Clerk 是账号标准；Supabase Auth 不启用。

---

### Task 1: 导入 Base UI Tasks 起点并建立测试工具

**Files:**
- Create: `package.json`, `pnpm-lock.yaml`, `app/**`, `components/**`, `lib/utils.ts`, `vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`
- Modify: `package.json`
- Test: `tests/smoke/home.test.tsx`

**Interfaces:**
- Consumes: Square UI `templates-baseui/tasks` 模板。
- Produces: `pnpm test`, `pnpm test:e2e`, `pnpm lint`, `pnpm build` 四个固定检查命令。

- [x] **Step 1: 把模板复制到项目根目录并初始化 Git**

```bash
git clone --depth 1 https://github.com/zerostaticthemes/square-ui.git /tmp/square-ui-source
rsync -a --exclude .git /tmp/square-ui-source/templates-baseui/tasks/ ./
git init
pnpm install
```

- [x] **Step 2: 安装测试和后台基础套件**

```bash
pnpm add @clerk/nextjs @supabase/supabase-js server-only zod
pnpm add -D vitest jsdom @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test supabase
```

- [x] **Step 3: 先写会失败的首页测试**

```tsx
// tests/smoke/home.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("home page", () => {
  it("shows the internal tool name", () => {
    render(<HomePage />);
    expect(screen.getByText("内部工作台")).toBeInTheDocument();
  });
});
```

- [x] **Step 4: 加入 Vitest 设置和脚本，再把首页标题改成“内部工作台”**

```ts
// vitest.config.ts
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"] },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
});
```

`package.json` 新增 `"test": "vitest run"` 和 `"test:e2e": "playwright test"`。

- [x] **Step 5: 运行并提交**

```bash
pnpm test
pnpm lint
git add .
git commit -m "chore: bootstrap base ui internal tool"
```

### Task 2: 建立环境设置和 Supabase 用户资料

**Files:**
- Create: `.env.example`, `lib/env/server.ts`, `lib/supabase/admin.ts`, `supabase/migrations/202608280001_profiles.sql`
- Test: `tests/lib/env-server.test.ts`

**Interfaces:**
- Produces: `serverEnv`, `supabaseAdmin`, `profiles` table。

- [x] **Step 1: 写环境变量测试**

```ts
import { describe, expect, it } from "vitest";
import { parseServerEnv } from "@/lib/env/server";

it("rejects a missing Slack team id", () => {
  expect(() => parseServerEnv({})).toThrow("ALLOWED_SLACK_TEAM_ID");
});
```

- [x] **Step 2: 实现固定环境格式**

```ts
const schema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  ALLOWED_SLACK_TEAM_ID: z.string().regex(/^T[A-Z0-9]+$/),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});
export const parseServerEnv = (input: NodeJS.ProcessEnv) => schema.parse(input);
```

`.env.example` 只放变量名称，不放任何真实密钥。

- [x] **Step 3: 建立用户资料表**

```sql
create type app_role as enum ('employee', 'admin');
create table profiles (
  clerk_user_id text primary key,
  role app_role not null default 'employee',
  display_name text not null,
  avatar_url text,
  slack_team_id text not null,
  slack_verified_at timestamptz not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table profiles enable row level security;
```

浏览器不直接读写该表；只有经过 Clerk 检查的 Next.js 后台使用 `supabaseAdmin`。

- [x] **Step 4: 运行测试和 Supabase 本地迁移**

```bash
pnpm test tests/lib/env-server.test.ts
pnpm exec supabase db reset
git add .env.example lib supabase tests
git commit -m "feat: add server configuration and profiles"
```

执行记录：本机没有 Docker，因此完整的 `supabase db reset` 留到连接 Supabase 项目时再跑；目前已用 PGlite 实际执行同一份 SQL，并验证角色、资料表和 RLS 均成功建立。

### Task 3: 实现第一次 Slack Workspace 验证

**Files:**
- Create: `lib/auth/types.ts`, `lib/auth/slack-workspace.ts`, `lib/auth/get-verified-user.ts`, `app/access-denied/page.tsx`
- Test: `tests/lib/slack-workspace.test.ts`, `tests/lib/get-verified-user.test.ts`

**Interfaces:**
- Produces: `type AppRole = "employee" | "admin"`。
- Produces: `assertAllowedSlackTeam(actual: string, expected: string): void`。
- Produces: `getVerifiedUser(): Promise<{ id: string; role: AppRole; name: string; imageUrl: string | null }>`。

- [ ] **Step 1: 写 Workspace 判断测试**

```ts
it("accepts the designated workspace", () => {
  expect(() => assertAllowedSlackTeam("T094DTFCVA8", "T094DTFCVA8")).not.toThrow();
});

it("rejects another workspace", () => {
  expect(() => assertAllowedSlackTeam("T000OTHER", "T094DTFCVA8")).toThrow("WRONG_SLACK_WORKSPACE");
});
```

- [ ] **Step 2: 实现 Slack Team ID 读取**

`getVerifiedUser()` 的第一次验证顺序固定为：

```ts
const tokens = await clerkClient.users.getUserOauthAccessToken(userId, "oauth_slack");
const response = await fetch("https://slack.com/api/openid.connect.userInfo", {
  headers: { Authorization: `Bearer ${tokens.data[0].token}` },
});
const info = await response.json() as { ok: boolean; "https://slack.com/team_id"?: string };
assertAllowedSlackTeam(info["https://slack.com/team_id"] ?? "", serverEnv.ALLOWED_SLACK_TEAM_ID);
```

通过后使用 Clerk Backend API 写入：

```ts
publicMetadata: {
  role: "employee",
  slackTeamId: serverEnv.ALLOWED_SLACK_TEAM_ID,
  slackVerifiedAt: new Date().toISOString(),
}
```

- [ ] **Step 3: 同步 Supabase profile**

验证通过后 `upsert` `clerk_user_id`, `role`, `display_name`, `avatar_url`, `slack_team_id`, `slack_verified_at`。已有验证时间时跳过 Slack 请求，但仍从 Clerk 当前 metadata 同步角色。

- [ ] **Step 4: 测试三条路径**

```bash
pnpm test tests/lib/slack-workspace.test.ts tests/lib/get-verified-user.test.ts
```

测试必须覆盖：未登录、第一次正确 Workspace、已有验证时间不再请求 Slack。

- [ ] **Step 5: 提交**

```bash
git add lib/auth app/access-denied tests
git commit -m "feat: verify Slack workspace on first sign in"
```

### Task 4: 建立登录页和受保护的系统外壳

**Files:**
- Create: `middleware.ts`, `app/login/[[...login]]/page.tsx`, `app/(protected)/layout.tsx`, `components/app-shell/app-sidebar.tsx`, `components/auth/admin-only.tsx`
- Modify: `app/layout.tsx`, `app/page.tsx`
- Test: `tests/components/admin-only.test.tsx`, `tests/e2e/login.spec.ts`

**Interfaces:**
- Consumes: `getVerifiedUser()`。
- Produces: `AdminOnly({ role, children })` 和受保护布局。

- [ ] **Step 1: 写角色显示测试**

```tsx
it("hides admin settings from employees", () => {
  render(<AdminOnly role="employee"><span>管理员设置</span></AdminOnly>);
  expect(screen.queryByText("管理员设置")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: 建立参考 JUYU Help Centre 的登录页**

页面显示“仅限指定 Slack Workspace 授权员工使用”和“使用 Slack 继续”，登录后回到 `redirect` 参数指定的内部页面。不要加入角色预览按钮。

- [ ] **Step 3: 在受保护布局重新检查身份**

`app/(protected)/layout.tsx` 调用 `getVerifiedUser()`；未登录跳去 `/login?redirect=当前路径`，错误 Workspace 跳去 `/access-denied`。

- [ ] **Step 4: 加入 Playwright 检查**

```ts
test("anonymous visitor is redirected to login", async ({ page }) => {
  await page.goto("/tasks");
  await expect(page).toHaveURL(/\/login\?redirect=/);
  await expect(page.getByText("使用 Slack 继续")).toBeVisible();
});
```

- [ ] **Step 5: 完成第一阶段检查并提交**

```bash
pnpm test
pnpm test:e2e
pnpm lint
pnpm build
git add .
git commit -m "feat: add protected app shell and Slack login page"
```

人工检查 Clerk 测试账号：正确 Workspace 第一次可进入；刷新和第二次登录不再出现 Workspace 验证；错误 Workspace 不能进入；员工看不到管理员设置。
