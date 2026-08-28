# 第四阶段：审核与内容排期 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成员工内容两位管理员批准、管理员内容一次批准、自动发布任务，以及日历、列表和内容看板。

**Architecture:** 审核规则集中在一个状态判断模块，数据库 RPC 在同一 transaction 保存内容状态、固定版本、批准、发布任务和历史，避免只成功一半。三种排期画面读取相同查询结果；看板拖动不能绕过审核规则。

**Tech Stack:** Next.js、Supabase Postgres RPC、BlockNote/Liveblocks、Base UI、date-fns、Vitest、Playwright

**Spec:** `docs/superpowers/specs/2026-08-28-internal-task-content-scheduling-design.md`

## Global Constraints

- 员工建立的内容需要两位不同管理员批准。
- 管理员建立的内容只需要一次批准，可自己批准或交给另一位管理员。
- 每次重新提交或修改已批准正文，旧批准全部失效。
- `in_review` 时正文不可修改，但普通留言和指定文字留言仍可使用。
- 只有批准齐全的内容才能进入 `approved`, `due`, `published`。
- 所有日期输入解释为 `Asia/Kuala_Lumpur`，数据库保存 UTC。

---

### Task 1: 建立审核、发布和历史资料

**Files:**
- Create: `supabase/migrations/202608280005_approval_workflow.sql`, `features/approval/types.ts`, `features/approval/rules.ts`
- Test: `tests/features/approval/rules.test.ts`

**Interfaces:**
- Produces: `requiredApprovals(authorRole: AppRole): 1 | 2`。
- Produces: `approvalProgress(required, distinctAdminIds): { count: number; complete: boolean }`。
- Produces: `canEditBody(status): boolean`, `canPublish(status): boolean`。

- [ ] **Step 1: 先写完整规则测试**

```ts
it("requires two distinct admins for employee content", () => {
  expect(requiredApprovals("employee")).toBe(2);
  expect(approvalProgress(2, ["boss-a", "boss-a"]).complete).toBe(false);
  expect(approvalProgress(2, ["boss-a", "boss-b"]).complete).toBe(true);
});

it("requires one approval for admin content", () => {
  expect(requiredApprovals("admin")).toBe(1);
});
```

- [ ] **Step 2: 建立表**

```sql
create table content_approvals (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id),
  version integer not null,
  admin_id text not null references profiles(clerk_user_id),
  approved_at timestamptz not null default now(),
  invalidated_at timestamptz,
  unique(content_id, version, admin_id)
);
create table content_review_events (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references contents(id),
  version integer not null,
  event_type text not null check(event_type in ('submitted','approved','changes_requested','resubmitted','approval_invalidated','published','archived')),
  actor_id text not null references profiles(clerk_user_id),
  message text,
  created_at timestamptz not null default now()
);
alter table contents add column required_approvals smallint not null default 2 check(required_approvals in (1,2));
alter table contents add column requested_reviewer_id text references profiles(clerk_user_id);
alter table contents add column published_by text references profiles(clerk_user_id);
alter table contents add column published_at timestamptz;
alter table contents add column linked_task_id uuid references tasks(id);
alter table tasks add constraint tasks_linked_content_fk foreign key(linked_content_id) references contents(id);
```

- [ ] **Step 3: 实现规则并运行测试**

```bash
pnpm exec supabase db reset
pnpm test tests/features/approval/rules.test.ts
git add supabase features/approval tests/features/approval
git commit -m "feat: add content approval model and rules"
```

### Task 2: 实现原子审核动作

**Files:**
- Create: `features/approval/actions.ts`, `features/approval/repository.ts`, `supabase/migrations/202608280006_approval_rpcs.sql`
- Test: `tests/features/approval/actions.test.ts`, `tests/features/approval/rpcs.test.ts`

**Interfaces:**
- Produces: `submitForReview(contentId, blocknoteJson, requestedReviewerId?: string)`。
- Produces: `approveContent(contentId, version)`。
- Produces: `requestChanges(contentId, version, message)`。
- Produces: `unlockApprovedContent(contentId)`。
- Produces: `markPublished(contentId)`。
- Produces: `archiveContent(contentId)`。

- [ ] **Step 1: 写版本过期测试**

```ts
it("rejects approval for an old version", async () => {
  mockedContent.current_version = 4;
  await expect(approveContent(mockedContent.id, 3)).resolves.toEqual({ ok: false, message: "内容已经更新，请重新检查" });
});
```

- [ ] **Step 2: 实现 `submit_content_for_review` RPC**

一个 transaction 必须：锁住内容、检查当前状态可提交、增加版本号、保存 `content_versions`、按作者当时角色写 `required_approvals`、保存管理员作者选择的 `requested_reviewer_id`、取消旧批准、更新相连发布任务、写 `submitted`/`resubmitted` 事件、把状态改成 `in_review`。

第四阶段同时把第三阶段的 `createContent()` 改为 `create_scheduled_content` RPC：建立内容时立即建立一张 `content_publish` 任务，任务负责人和到期时间分别等于内容负责人和发布时间，并互相写入 `linked_task_id` / `linked_content_id`。迁移时为已有内容补建发布任务。

- [ ] **Step 3: 实现 `approve_content_version` RPC**

只接受管理员；锁住内容；检查传入版本等于当前版本；相同管理员不可重复计数；达到所需人数时改成 `approved`，否则保持 `in_review`。

- [ ] **Step 4: 实现退回和发布 RPC**

`request_changes` 要求非空留言，将状态改成 `changes_requested` 并允许编辑。`unlockApprovedContent` 先取消所有现有批准再解锁正文。`mark_published` 只接受 `approved` 或 `due`，记录操作者和真实时间，并同时把 `linked_task_id` 对应任务改成 `done`。`archiveContent` 收起内容及相连未完成任务，但保留版本、批准、留言和历史。

- [ ] **Step 5: 运行并提交**

```bash
pnpm test tests/features/approval
git add features/approval supabase tests/features/approval
git commit -m "feat: add transactional content workflow"
```

### Task 3: 建立内容表单、详情和审核画面

**Files:**
- Create: `app/(protected)/content/new/page.tsx`, `app/(protected)/content/[contentId]/page.tsx`, `features/content/components/content-form.tsx`, `features/approval/components/review-actions.tsx`, `features/approval/components/approval-progress.tsx`, `features/approval/components/review-history.tsx`
- Test: `tests/features/approval/review-actions.test.tsx`, `tests/e2e/content-review.spec.ts`

**Interfaces:**
- Consumes: 第三阶段的 `BlockNoteEditor`、两种留言和附件。
- Consumes: `submitForReview`, `approveContent`, `requestChanges`, `markPublished`。

- [ ] **Step 1: 写员工审核进度测试**

```tsx
it("shows one of two approvals", () => {
  render(<ApprovalProgress required={2} approvals={[approvalByBossA]} />);
  expect(screen.getByText("已批准 1/2")).toBeInTheDocument();
});
```

- [ ] **Step 2: 实现内容表单**

固定栏目只有标题、一个或多个平台、发布时间、负责员工和附件。不要加入内容目的、观众、CTA、标签、每个平台文案、Hashtag 或图片说明。

- [ ] **Step 3: 实现审核锁定**

`editable` 只在 `draft` 或 `changes_requested` 为真。已批准正文如要修改，先显示“修改后需要重新批准”确认；确认后执行 `invalidateApprovalAndUnlock(contentId)`。

- [ ] **Step 4: 实现管理员两种路径**

管理员作者看到“自己批准”和“交给另一位管理员”。选择另一人时必须保存该管理员的 Clerk User ID，自己不会自动计入批准，而且只有被指定的另一位管理员可以完成这次批准。员工作者永远显示两位不同管理员的进度。

- [ ] **Step 5: E2E 覆盖完整流程并提交**

```bash
pnpm test tests/features/approval
pnpm test:e2e tests/e2e/content-review.spec.ts
git add app features tests
git commit -m "feat: add content review interface"
```

E2E 固定覆盖：员工提交 → 上司 A 批准 1/2 → 上司 B 退回 → 员工修改重交 → A、B 重新批准；管理员内容自己一次批准；旧页面不能批准旧版本。

### Task 4: 建立日历、列表和内容看板

**Files:**
- Create: `app/(protected)/content/page.tsx`, `features/schedule/queries.ts`, `features/schedule/components/schedule-tabs.tsx`, `features/schedule/components/content-calendar.tsx`, `features/schedule/components/content-list.tsx`, `features/schedule/components/content-board.tsx`, `features/schedule/date.ts`
- Test: `tests/features/schedule/date.test.ts`, `tests/features/schedule/views.test.tsx`

**Interfaces:**
- Produces: `toMalaysiaDateKey(utcIso): string`。
- Produces: `listScheduledContent(filters): Promise<ScheduledContent[]>`。

- [ ] **Step 1: 写跨日时区测试**

```ts
it("groups UTC evening into the next Malaysia day", () => {
  expect(toMalaysiaDateKey("2026-08-28T18:00:00.000Z")).toBe("2026-08-29");
});
```

- [ ] **Step 2: 建立单一查询**

三种画面全部使用 `listScheduledContent({ platformId, assigneeId, status, from, to })`。不要为三种画面各写一套状态判断。

- [ ] **Step 3: 实现三种画面**

日历按马来西亚日期分组；列表显示标题、平台、员工、审核进度和发布时间；看板按 `draft`, `in_review`, `changes_requested`, `approved`, `due`, `published` 分栏。

- [ ] **Step 4: 阻止拖动跳过审核**

看板只允许：`draft ↔ changes_requested` 的可编辑整理，以及 `approved → due` 由系统时间触发。任何拖到 `approved` 或 `published` 的动作返回“必须使用批准或已发布按钮”。

- [ ] **Step 5: 加入首页摘要并完成阶段检查**

首页显示今天任务、过期任务、等待检查、即将发布、超过发布时间未发布五组资料。

```bash
pnpm test
pnpm test:e2e
pnpm lint
pnpm build
git add .
git commit -m "feat: add content schedule views and dashboard"
```

人工检查：同一筛选在日历、列表、看板出现相同内容；马来西亚午夜附近日期正确；看板不能跳过审核；点击已发布会完成相连任务并留下人和时间。
