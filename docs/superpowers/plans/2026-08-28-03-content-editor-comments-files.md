# 第三阶段：内容编辑、指定文字留言与文件 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让使用者建立内容、使用 BlockNote 即时编辑、针对文字留言，并安全上传图片、影片和文件。

**Architecture:** Supabase 保存内容资料、普通留言、附件和提交时的固定版本。Liveblocks 为每条内容建立一个私人 Room，永久保存 BlockNote 文件和指定文字留言；Next.js 用 Clerk 身份签发 Room 权限，并把 Liveblocks 留言事件复制到 Supabase 历史记录。

**Tech Stack:** BlockNote、Liveblocks BlockNote、Clerk、Supabase Postgres、Supabase Storage、Next.js、Vitest、Playwright

**Spec:** `docs/superpowers/specs/2026-08-28-internal-task-content-scheduling-design.md`

## Global Constraints

- 第一阶段功能范围内同时提供普通留言和指定文字留言。
- 内容 Room ID 固定为 `content:{contentId}`，不能使用标题组成 Room ID。
- Liveblocks Secret Key 只在后台使用；Room 授权入口必须调用 `getVerifiedUser()`。
- Supabase Storage bucket 固定为私人 bucket `content-files`。
- 文件下载链接只在权限通过后产生，默认 60 秒失效。
- 提交审核所用的固定版本由第四阶段建立；本阶段先提供 `createContentSnapshot()` 接口。

---

### Task 1: 建立内容、平台、普通留言和文件资料表

**Files:**
- Create: `supabase/migrations/202608280003_content_core.sql`, `features/content/types.ts`, `features/content/schema.ts`, `features/content/repository.ts`
- Test: `tests/features/content/schema.test.ts`, `tests/features/content/repository.test.ts`

**Interfaces:**
- Produces: `ContentRecord`, `ContentPlatform`, `ContentAttachment`, `contentInputSchema`。
- Produces: `createContentSnapshot(contentId, actorId, blocknoteJson): Promise<string>`。

- [ ] **Step 1: 写内容格式测试**

```ts
it("requires at least one platform", () => {
  const result = contentInputSchema.safeParse({ title: "明天内容", platformIds: [], publishAt: "2026-08-29T02:00:00.000Z", assigneeId: "u1" });
  expect(result.success).toBe(false);
});
```

- [ ] **Step 2: 建立核心资料表**

```sql
create type content_status as enum ('draft', 'in_review', 'changes_requested', 'approved', 'due', 'published', 'archived');
create table platforms (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#64748b',
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create table contents (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 200),
  status content_status not null default 'draft',
  author_id text not null references profiles(clerk_user_id),
  assignee_id text not null references profiles(clerk_user_id),
  publish_at timestamptz not null,
  liveblocks_room_id text not null unique,
  current_version integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table content_platforms (content_id uuid references contents(id), platform_id uuid references platforms(id), primary key(content_id, platform_id));
create table content_comments (id uuid primary key default gen_random_uuid(), content_id uuid not null references contents(id), author_id text not null references profiles(clerk_user_id), body text not null check(char_length(body) between 1 and 5000), created_at timestamptz not null default now());
create table content_attachments (id uuid primary key default gen_random_uuid(), content_id uuid not null references contents(id), storage_path text not null unique, file_name text not null, mime_type text not null, byte_size bigint not null check(byte_size > 0), uploader_id text not null references profiles(clerk_user_id), created_at timestamptz not null default now());
create table content_versions (id uuid primary key default gen_random_uuid(), content_id uuid not null references contents(id), version integer not null, blocknote_json jsonb not null, created_by text not null references profiles(clerk_user_id), created_at timestamptz not null default now(), unique(content_id, version));
```

- [ ] **Step 3: 实现 repository 和运行测试**

`createContent()` 先产生 UUID，再写 `liveblocks_room_id = "content:" + id`。平台连接和内容必须在一个数据库 transaction/RPC 里保存。

```bash
pnpm exec supabase db reset
pnpm test tests/features/content
git add supabase features/content tests/features/content
git commit -m "feat: add content core data model"
```

### Task 2: 建立 Liveblocks 私人 Room 和 BlockNote 编辑器

**Files:**
- Create: `liveblocks.config.ts`, `lib/liveblocks/server.ts`, `app/api/liveblocks-auth/route.ts`, `features/content/components/content-room.tsx`, `features/content/components/blocknote-editor.tsx`
- Modify: `.env.example`, `package.json`
- Test: `tests/api/liveblocks-auth.test.ts`, `tests/features/content/blocknote-editor.test.tsx`

**Interfaces:**
- Produces: `ContentRoom({ contentId, children })`。
- Produces: `BlockNoteEditor({ contentId, editable })`。

- [ ] **Step 1: 安装官方整合套件**

```bash
pnpm add @blocknote/core @blocknote/react @blocknote/mantine @liveblocks/client @liveblocks/react @liveblocks/node @liveblocks/react-blocknote
```

`.env.example` 新增 `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`、`LIVEBLOCKS_SECRET_KEY` 和 `LIVEBLOCKS_WEBHOOK_SECRET`。前端只可读取 Public Key；其余两个只在后台读取。

- [ ] **Step 2: 写 Room 权限测试**

```ts
it("refuses a room id that is not an existing content record", async () => {
  mockedFindContent.mockResolvedValue(null);
  const response = await POST(requestWithRoom("content:missing"));
  expect(response.status).toBe(403);
});
```

- [ ] **Step 3: 实现后台授权**

授权入口必须检查：用户已经验证、Room ID 格式正确、对应内容存在且未收起。通过后 `prepareSession(user.id, { userInfo: { name, avatar, role } })`，只允许该 Room 的写入权限。

- [ ] **Step 4: 实现编辑器**

```tsx
const editor = useCreateBlockNoteWithLiveblocks({}, { field: "document" });
return <BlockNoteView editor={editor} editable={editable} />;
```

加载中显示骨架；断线时显示“尚未同步”；重新连接后显示“已经同步”。不要启用实验离线模式。

- [ ] **Step 5: 测试并提交**

```bash
pnpm test tests/api/liveblocks-auth.test.ts tests/features/content/blocknote-editor.test.tsx
git add liveblocks.config.ts lib/liveblocks app/api features/content package.json pnpm-lock.yaml .env.example
git commit -m "feat: add collaborative BlockNote rooms"
```

### Task 3: 加入指定文字留言和普通聊天留言

**Files:**
- Create: `features/content/components/inline-threads.tsx`, `features/content/components/content-chat.tsx`, `features/content/actions/comments.ts`, `app/api/liveblocks-webhook/route.ts`, `supabase/migrations/202608280004_inline_comment_events.sql`
- Test: `tests/features/content/inline-threads.test.tsx`, `tests/api/liveblocks-webhook.test.ts`

**Interfaces:**
- Produces: `InlineThreads({ editor })`，桌面显示侧栏，手机显示浮动留言。
- Produces: `addContentComment(contentId, body)`。

- [ ] **Step 1: 写留言组件测试**

```tsx
it("shows anchored threads on desktop and floating threads on mobile", () => {
  render(<InlineThreads editor={fakeEditor} threads={fakeThreads} />);
  expect(screen.getByTestId("anchored-threads")).toBeInTheDocument();
  expect(screen.getByTestId("floating-threads")).toBeInTheDocument();
});
```

- [ ] **Step 2: 接上 Liveblocks 留言组件**

编辑器工具列开启 `FloatingComposer`。页面同时渲染：

```tsx
<AnchoredThreads editor={editor} threads={threads} />
<FloatingThreads editor={editor} threads={threads} />
```

Liveblocks Room 权限只允许已验证成员。留言允许新增、回复、解决和重新打开；界面不提供修改别人的留言或永久删除历史的按钮。

- [ ] **Step 3: 建立留言事件副本**

`inline_comment_events` 保存 `room_id`, `thread_id`, `comment_id`, `event_type`, `actor_id`, `payload`, `occurred_at`。Webhook 必须先用 Liveblocks Webhook Secret 验证签名，再用 `event.id` 做唯一键防止重复。

- [ ] **Step 4: 实现普通聊天留言**

普通留言写 `content_comments`；显示位置固定在编辑器下面，包含头像、名字、马来西亚时间和正文。

- [ ] **Step 5: 测试并提交**

```bash
pnpm test tests/features/content/inline-threads.test.tsx tests/api/liveblocks-webhook.test.ts
git add features/content app/api/liveblocks-webhook supabase
git commit -m "feat: add inline and general content comments"
```

### Task 4: 加入私人文件上传与下载

**Files:**
- Create: `features/content/files/schema.ts`, `features/content/files/actions.ts`, `features/content/components/attachments.tsx`, `app/api/files/[attachmentId]/route.ts`, `supabase/storage/content-files.sql`
- Test: `tests/features/content/files.test.ts`, `tests/api/file-download.test.ts`

**Interfaces:**
- Produces: `requestUpload(contentId, fileMeta)`, `finishUpload(contentId, storagePath, fileMeta)`, `GET /api/files/:attachmentId`。

- [ ] **Step 1: 写文件规则测试**

```ts
it("rejects a file larger than 100 MB", () => {
  expect(fileSchema.safeParse({ name: "video.mp4", type: "video/mp4", size: 100 * 1024 * 1024 + 1 }).success).toBe(false);
});
```

- [ ] **Step 2: 建立私人 bucket**

只允许 `image/*`, `video/*`, `audio/*`, `application/pdf` 和常见 Office 文件；单一文件上限 100 MB。路径固定为 `{contentId}/{randomUuid}-{safeFileName}`。

- [ ] **Step 3: 实现短期下载链接**

下载入口先调用 `getVerifiedUser()`，再确认附件对应内容没有收起，最后使用 Supabase Admin 产生 60 秒 signed URL 并以 302 跳转。

- [ ] **Step 4: 完成第三阶段检查**

```bash
pnpm test
pnpm test:e2e
pnpm lint
pnpm build
git add .
git commit -m "feat: add private content attachments"
```

人工检查：两个浏览器同时打开同一内容可看到即时文字；选中文字留言、回复、解决和重新打开；普通留言在编辑器下面；断线提示正确；无权限下载被拒绝；下载链接过期后不能继续使用。
