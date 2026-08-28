# 第五阶段：Slack、管理员设置与历史 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成可客制的 Slack 频道通知、马来西亚时间提醒、管理员设置、失败重发和不可随便删除的历史记录。

**Architecture:** 应用动作只建立“待发送通知”，不直接等待 Slack。Supabase Cron 定时调用 Edge Function 处理到期提醒和发送队列；每条消息有独一编号，成功后不会重复发送。管理员页面经 Clerk 后台角色检查后才能读写设置。

**Tech Stack:** Supabase Cron、Supabase Edge Functions、Slack Web API、Next.js、Clerk、Supabase Postgres、Vitest、Deno Test、Playwright

**Spec:** `docs/superpowers/specs/2026-08-28-internal-task-content-scheduling-design.md`

## Global Constraints

- Slack 只发到指定 Workspace 内、Slack App 有权访问的频道。
- 私人频道必须先邀请 Slack App，系统才允许保存。
- 通知事件固定为：提交、第一位批准、全部批准、要求修改、重新提交、提前提醒、到时提醒、已经发布。
- 到时但未批准，只提醒管理员，不叫员工发布。
- 每个成功事件只发送一次；失败可以安全重试。
- 管理员设置的每个后台动作必须再次检查 `role === "admin"`。

---

### Task 1: 建立通知设置、发送队列和总历史

**Files:**
- Create: `supabase/migrations/202608280007_notifications_audit.sql`, `features/notifications/types.ts`, `features/notifications/idempotency.ts`, `features/audit/repository.ts`
- Test: `tests/features/notifications/idempotency.test.ts`

**Interfaces:**
- Produces: `NotificationEvent` 联合类型。
- Produces: `deliveryKey(event, contentId, version, scheduledFor): string`。
- Produces: `recordAudit(event): Promise<void>`。

- [ ] **Step 1: 写重复消息编号测试**

```ts
it("creates the same key for the same reminder", () => {
  const a = deliveryKey("publish_due", "content-1", 3, "2026-08-29T02:00:00.000Z");
  const b = deliveryKey("publish_due", "content-1", 3, "2026-08-29T02:00:00.000Z");
  expect(a).toBe(b);
});
```

- [ ] **Step 2: 建立资料表**

```sql
create table notification_settings (
  id boolean primary key default true check(id),
  slack_channel_id text,
  slack_channel_name text,
  reminder_minutes integer not null default 1440 check(reminder_minutes between 5 and 10080),
  enabled_events jsonb not null default '{"submitted":true,"first_approved":true,"all_approved":true,"changes_requested":true,"resubmitted":true,"publish_advance":true,"publish_due":true,"published":true}'::jsonb,
  updated_by text references profiles(clerk_user_id),
  updated_at timestamptz not null default now()
);
create table slack_deliveries (
  id uuid primary key default gen_random_uuid(),
  delivery_key text not null unique,
  event_type text not null,
  content_id uuid references contents(id),
  channel_id text not null,
  payload jsonb not null,
  status text not null check(status in ('pending','sending','sent','failed','cancelled')),
  attempt_count integer not null default 0,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);
create table audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id text,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
```

- [ ] **Step 3: 在已有动作写入 audit 和通知队列**

提交、批准、退回、重交、发布、改时间、收起、设置修改都写 `audit_events`。业务 transaction 只插入 `slack_deliveries(status='pending')`；不要在 transaction 里调用 Slack 网络。

- [ ] **Step 4: 测试并提交**

```bash
pnpm test tests/features/notifications/idempotency.test.ts
git add supabase features/notifications features/audit tests
git commit -m "feat: add notification queue and audit log"
```

### Task 2: 建立 Slack 频道和管理员设置

**Files:**
- Create: `lib/slack/client.ts`, `features/admin/actions.ts`, `features/admin/queries.ts`, `app/(protected)/admin/settings/page.tsx`, `features/admin/components/slack-settings-form.tsx`, `features/admin/components/platform-settings.tsx`, `features/admin/components/member-list.tsx`
- Test: `tests/features/admin/actions.test.ts`, `tests/e2e/admin-settings.spec.ts`

**Interfaces:**
- Produces: `listAllowedSlackChannels()`。
- Produces: `saveNotificationSettings(input)`。
- Produces: `createPlatform`, `updatePlatform`, `archivePlatform`。

- [ ] **Step 1: 写员工拒绝测试**

```ts
it("rejects notification changes from an employee", async () => {
  mockedGetVerifiedUser.mockResolvedValue(employeeUser);
  await expect(saveNotificationSettings(validSettings)).resolves.toEqual({ ok: false, message: "只有管理员可以修改设置" });
});
```

- [ ] **Step 2: 读取 Slack 频道**

后台使用 `conversations.list` 分页读取公开频道和 App 已加入的私人频道。保存前调用 `conversations.info`；返回 `channel_not_found` 或 `not_in_channel` 时显示“请先把 Slack App 加进这个频道”。

`.env.example` 新增 `SLACK_BOT_TOKEN`、`SLACK_SIGNING_SECRET`、`NEXT_PUBLIC_APP_URL` 和 `SUPABASE_EDGE_FUNCTION_SECRET`，全部真实秘密只放在 Vercel、Supabase Vault 或 Edge Function Secrets。

- [ ] **Step 3: 实现管理员设置**

页面包含：平台新增/改名/停用、Slack 频道、八种通知开关、提前分钟数、成员只读清单、失败发送清单。员工直接打开 URL 返回 403 页面。

- [ ] **Step 4: 测试并提交**

```bash
pnpm test tests/features/admin/actions.test.ts
pnpm test:e2e tests/e2e/admin-settings.spec.ts
git add lib/slack features/admin app tests
git commit -m "feat: add admin platform and Slack settings"
```

### Task 3: 建立到期判断和 Slack Edge Function

**Files:**
- Create: `supabase/functions/process-slack-queue/index.ts`, `supabase/functions/process-slack-queue/message.ts`, `supabase/functions/process-slack-queue/deno.json`, `supabase/functions/process-slack-queue/index.test.ts`, `supabase/migrations/202608280008_cron.sql`
- Test: `supabase/functions/process-slack-queue/index.test.ts`

**Interfaces:**
- Produces: `buildSlackMessage(event, content, appUrl)`。
- Produces: `processDueContent(now)` 和 `processPendingDeliveries(now)`。

- [ ] **Step 1: 写到时未批准测试**

```ts
Deno.test("unapproved due content alerts admins without publish instruction", () => {
  const message = buildSlackMessage("publish_due_unapproved", unapprovedContent, "https://internal.example");
  assertStringIncludes(message.text, "还没批准");
  assertFalse(message.text.includes("请现在发布"));
});
```

- [ ] **Step 2: 实现到期扫描**

每分钟处理两类：`publish_at - reminder_minutes <= now` 的提前提醒，以及 `publish_at <= now` 的到时提醒。批准齐全写 `publish_due` 并把状态改成 `due`；未批准写 `publish_due_unapproved`，内容保持原审核状态。

修改发布时间时，在同一个 transaction 将旧时间对应、尚未发送的 `publish_advance` 和 `publish_due` 消息改成 `cancelled`，再用新时间产生新的 `delivery_key`。发送器永远跳过 `cancelled`。

- [ ] **Step 3: 实现安全发送和重试**

领取消息时用数据库锁把 `pending/failed` 改成 `sending`。Slack 成功写 `sent`、`sent_at`；失败写 `failed`、错误和次数。自动重试最多 5 次，间隔为 1、5、15、60、240 分钟；管理员手动重试不受自动次数限制，但不能重发 `sent`。

- [ ] **Step 4: 建立 Cron**

`pg_cron` 每分钟通过 `pg_net` 调用 Edge Function，并使用 Supabase Vault 保存调用密钥。迁移不写真实密钥。

- [ ] **Step 5: 运行测试并提交**

```bash
pnpm exec supabase functions serve process-slack-queue --no-verify-jwt
deno test supabase/functions/process-slack-queue/index.test.ts
git add supabase/functions supabase/migrations
git commit -m "feat: send scheduled Slack notifications"
```

### Task 4: 加入失败重发和历史画面

**Files:**
- Create: `features/admin/actions/retry-slack-delivery.ts`, `app/(protected)/admin/history/page.tsx`, `features/admin/components/delivery-log.tsx`, `features/admin/components/audit-log.tsx`
- Modify: `app/(protected)/content/[contentId]/page.tsx`
- Test: `tests/features/admin/retry-slack.test.ts`, `tests/e2e/history.spec.ts`

**Interfaces:**
- Produces: `retrySlackDelivery(deliveryId)`。

- [ ] **Step 1: 写已成功消息不能重发测试**

```ts
it("does not retry a sent delivery", async () => {
  mockedDelivery.status = "sent";
  await expect(retrySlackDelivery(mockedDelivery.id)).resolves.toEqual({ ok: false, message: "这条消息已经发送成功" });
});
```

- [ ] **Step 2: 实现管理员历史页面**

可以按资料类型、操作者、动作和日期筛选。内容详情同时显示修改、批准、退回、Slack 和发布记录；时间全部显示马来西亚时间。

- [ ] **Step 3: 实现重发**

管理员点击重发后只把失败消息改成 `pending` 并写 audit；实际发送仍由队列处理。按钮在等待期间禁用，防止连点。

- [ ] **Step 4: 完成全系统检查**

```bash
pnpm test
pnpm test:e2e
pnpm lint
pnpm build
deno test supabase/functions/process-slack-queue/index.test.ts
git status --short
git add .
git commit -m "feat: add Slack retry and complete audit history"
```

人工验收必须逐项通过：八种开关；公开和私人频道；提前提醒；批准后到时提醒员工；未批准只提醒管理员；发布时间改变后旧提醒不发；失败可重试；成功不重复；发布后记录人和时间并完成任务；员工不能打开管理员页面；所有重要动作有历史。
