# JUYU Help Center Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复帮助中心全部已知问题，补齐空白分类和真实内容组件示范，并让原定 21 项功能在电脑、手机和正式网站都能实际使用。

**Architecture:** 保留现有 Next.js、MDX、Clerk、Supabase 和 JUYU 工作台外壳。先修复 MDX 客户端分页资料与阅读区滚动两个根本问题，再补齐文章资料、最近更新、媒体/PDF 资产和端到端验收；每个程序变更都按测试失败、最小实现、测试通过的顺序完成。

**Tech Stack:** Next.js 16、React 19、TypeScript、Tailwind CSS 4、next-mdx-remote、KaTeX、Mermaid、Clerk、Supabase、Vitest、Playwright。

**Spec:** `docs/superpowers/specs/2026-09-03-help-center-completion-design.md`

## Global Constraints

- 不启动或分派任何子助手；全部工作在当前任务内直接执行。
- 不改变任务、内容排期、审核、Slack、Clerk 登录和现有权限行为。
- 所有用户文案使用白话中文。
- 新增帮助资料只保存在 `content/help/` 和 `public/help/`，不连接 GitBook 云端。
- 任何单一内容组件资料错误时不能让整篇文章崩溃。
- 每个程序修改先写会失败的真实行为测试，再写实现。
- 不修改或提交用户现有的 `audits/` 未跟踪资料。

---

### Task 1: 修复复杂 MDX 文章和分页标签

**Files:**
- Modify: `tests/features/help-document-view.test.tsx`
- Modify: `features/help-center/gitbook/tabs.tsx`
- Modify: `content/help/content-review/submit-review.mdx`

**Interfaces:**
- Consumes: `HelpDocumentView({ source })` and MDX `<Tabs labels="员工|管理员">`.
- Produces: `HelpTabs({ labels?: string[] | string, children })`，即使资料不完整也不会抛错。

- [ ] **Step 1: 写会失败的分页资料测试**

```tsx
it("keeps an article alive when tab labels cross the MDX boundary", () => {
  render(
    <HelpTabs labels="员工|管理员">
      <p>员工步骤</p>
      <p>管理员步骤</p>
    </HelpTabs>
  );
  expect(screen.getByRole("tab", { name: "员工" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "管理员" }));
  expect(screen.getByRole("tabpanel")).toHaveTextContent("管理员步骤");
});

it("shows safe fallback labels instead of crashing", () => {
  render(<HelpTabs><p>第一段</p><p>第二段</p></HelpTabs>);
  expect(screen.getByRole("tab", { name: "分页 1" })).toBeInTheDocument();
});

it("renders the complete submit-review MDX article", async () => {
  const source = await readFile("content/help/content-review/submit-review.mdx", "utf8");
  const view = await HelpDocumentView({ source });
  render(view);
  expect(screen.getByRole("tab", { name: "员工" })).toBeInTheDocument();
  expect(screen.getByLabelText("流程图")).toBeInTheDocument();
});
```

- [ ] **Step 2: 运行测试并确认失败原因正确**

Run: `pnpm vitest run tests/features/help-document-view.test.tsx`

Expected: TypeScript 或运行时失败，因为当前 `labels` 只接受数组，而且会直接执行 `labels.map(...)`。

- [ ] **Step 3: 写最小修复**

```tsx
type HelpTabsProps = {
  labels?: string[] | string;
  children: ReactNode;
};

const parsedLabels = Array.isArray(labels)
  ? labels
  : typeof labels === "string"
    ? labels.split("|").map((label) => label.trim()).filter(Boolean)
    : [];
const safeLabels = panels.map((_, index) => parsedLabels[index] || `分页 ${index + 1}`);
```

Use `safeLabels.map(...)` for the buttons. Change the MDX line to:

```mdx
<Tabs labels="员工|管理员">
```

- [ ] **Step 4: 运行测试确认通过**

Run: `pnpm vitest run tests/features/help-document-view.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add tests/features/help-document-view.test.tsx features/help-center/gitbook/tabs.tsx content/help/content-review/submit-review.mdx
git commit -m "fix: keep rich help articles rendering"
```

---

### Task 2: 修复回到顶部控制错误区域

**Files:**
- Modify: `tests/features/help-navigation.test.tsx`
- Modify: `features/help-center/gitbook/scroll-to-top.tsx`

**Interfaces:**
- Produces: 点击 `HelpScrollToTop` 时优先滚动按钮所在的最近一个 `<main>`，找不到时才使用 `window.scrollTo`。

- [ ] **Step 1: 把现有测试改成真实阅读区测试并观察失败**

```tsx
it("scrolls the article main area back to the top", () => {
  const mainScrollTo = vi.fn();
  render(<main><div><HelpScrollToTop /></div></main>);
  const main = screen.getByRole("main");
  Object.defineProperty(main, "scrollTo", { value: mainScrollTo });

  fireEvent.click(screen.getByRole("button", { name: "回到顶部" }));

  expect(mainScrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
});
```

- [ ] **Step 2: 运行并确认旧代码错误调用 `window.scrollTo`**

Run: `pnpm vitest run tests/features/help-navigation.test.tsx`

- [ ] **Step 3: 写最小修复**

```tsx
onClick={(event) => {
  const main = event.currentTarget.closest("main");
  if (main) main.scrollTo({ top: 0, behavior: "smooth" });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}}
```

- [ ] **Step 4: 运行测试确认通过并提交**

Run: `pnpm vitest run tests/features/help-navigation.test.tsx`

```bash
git add tests/features/help-navigation.test.tsx features/help-center/gitbook/scroll-to-top.tsx
git commit -m "fix: scroll help articles to the top"
```

---

### Task 3: 补齐四个空白分类和最近更新

**Files:**
- Modify: `tests/features/help-content.test.ts`
- Modify: `tests/app/help-pages.test.tsx`
- Modify: `features/help-center/content/registry.ts`
- Modify: `features/help-center/components/help-home.tsx`
- Create: `content/help/task-management/manage-tasks.mdx`
- Create: `content/help/publishing/publish-content.mdx`
- Create: `content/help/platforms/manage-platforms.mdx`
- Create: `content/help/faq/common-questions.mdx`

**Interfaces:**
- Produces: `getRecentlyUpdatedHelpArticles(limit?: number): HelpArticle[]`。
- Produces: 8 个分类全部至少一篇文章，首页显示“最近更新文章”。

- [ ] **Step 1: 写会失败的分类和更新时间排序测试**

```ts
it("has at least one real article in every help category", () => {
  expect(getHelpNavigation().every((category) => category.articles.length > 0)).toBe(true);
});

it("returns recently updated articles in stable order", () => {
  const recent = getRecentlyUpdatedHelpArticles(4);
  expect(recent).toHaveLength(4);
  expect(recent.map((article) => article.updatedAt))
    .toEqual([...recent.map((article) => article.updatedAt)].sort().reverse());
});
```

Add to `tests/app/help-pages.test.tsx`:

```tsx
expect(screen.getByRole("heading", { name: "最近更新" })).toBeInTheDocument();
expect(screen.queryByText("文章准备中")).not.toBeInTheDocument();
```

- [ ] **Step 2: 运行测试确认四个空分类与缺少函数导致失败**

Run: `pnpm vitest run tests/features/help-content.test.ts tests/app/help-pages.test.tsx`

- [ ] **Step 3: 新增四篇真实文章和 registry 记录**

Each article entry includes `slug`, `title`, `description`, `category`, `order`, `cover`, `tags`, `updatedAt`, and `sourcePath`. Use these exact slugs:

```ts
"任务管理/建立与跟进任务"
"发布流程/从批准到发布"
"平台操作/管理发布平台"
"常见问题/权限与内容状态"
```

The MDX content must document only current behavior: task assignment/status/deletion, two-admin approval, scheduled reminder/manual publication, admin-managed custom platforms, Slack notifications and role rules.

- [ ] **Step 4: 新增最近更新函数和首页区块**

```ts
export function getRecentlyUpdatedHelpArticles(limit = 4) {
  return getHelpArticles()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.order - right.order)
    .slice(0, limit);
}
```

Render a `最近更新` section between `常用文章` and `所有分类`, with title, category and update date linking to each article.

- [ ] **Step 5: 运行测试确认通过并提交**

Run: `pnpm vitest run tests/features/help-content.test.ts tests/app/help-pages.test.tsx`

```bash
git add tests/features/help-content.test.ts tests/app/help-pages.test.tsx features/help-center/content/registry.ts features/help-center/components/help-home.tsx content/help
git commit -m "feat: complete help article categories"
```

---

### Task 4: 加入可实际使用的媒体、文件和 PDF 示例

**Files:**
- Modify: `tests/features/help-document-view.test.tsx`
- Modify: `tests/features/help-content.test.ts`
- Modify: `features/help-center/content/registry.ts`
- Create: `content/help/platforms/help-content-components.mdx`
- Create: `public/help/content-publishing-checklist.pdf`

**Interfaces:**
- Produces: one live article containing Image, Video, File, table, Hint, Tabs, code, math, Mermaid and Pdf.

- [ ] **Step 1: 写会失败的完整示范文章测试**

```tsx
const source = await readFile("content/help/platforms/help-content-components.mdx", "utf8");
const view = await HelpDocumentView({ source });
render(view);
expect(screen.getByRole("img", { name: "帮助中心文章封面示范" })).toBeInTheDocument();
expect(screen.getByTitle("帮助中心影片示范")).toBeInTheDocument();
expect(screen.getByTitle("内容发布检查清单 PDF")).toBeInTheDocument();
```

Continue the same test with assertions for a download link, table, note, tabs, copy-code button, math label and Mermaid label.

- [ ] **Step 2: 运行测试并确认示范文章和 PDF 尚不存在**

Run: `pnpm vitest run tests/features/help-document-view.test.tsx tests/features/help-content.test.ts`

- [ ] **Step 3: 创建一页 PDF 检查清单**

Create `content-publishing-checklist.pdf` with the exact checklist: 标题、平台、负责人、发布时间、正文已同步、两位管理员已批准、Slack 通知正常、发布后标记已发布. Render it to PNG and inspect it before keeping the PDF.

- [ ] **Step 4: 新增组件示范文章**

Use the exact safe blocks:

```mdx
<Image src="/mascots/chiikawa-peek.png" alt="帮助中心文章封面示范" caption="图片和图片说明示范" />
<Video src="https://www.youtube-nocookie.com/embed/M7lc1UVf-VE" title="帮助中心影片示范" />
<File href="/help/sample-checklist.txt" name="发布检查清单文字版" size="1KB" />
<Pdf src="/help/content-publishing-checklist.pdf" title="内容发布检查清单 PDF" />
<Tabs labels="员工|管理员"><div>员工说明</div><div>管理员说明</div></Tabs>
<Math formula="1 + 1 = 2" />
<Mermaid chart="flowchart LR; A[完成正文] --> B[两位管理员批准] --> C[发布]" />
```

Also include a Markdown table, a fenced `text` code block and a `Hint`.

- [ ] **Step 5: 运行测试确认通过并提交**

Run: `pnpm vitest run tests/features/help-document-view.test.tsx tests/features/help-content.test.ts`

```bash
git add tests/features/help-document-view.test.tsx tests/features/help-content.test.ts features/help-center/content/registry.ts content/help/platforms/help-content-components.mdx public/help/content-publishing-checklist.pdf
git commit -m "feat: add complete help content examples"
```

---

### Task 5: 补强 PDF、反馈和完整文章保护测试

**Files:**
- Modify: `tests/features/help-pdf.test.tsx`
- Modify: `tests/features/help-feedback.test.tsx`
- Modify: `tests/features/help-content.test.ts`
- Modify: `features/help-center/gitbook/pdf.css`

**Interfaces:**
- Verifies every registered source file loads and the printable layout remains light and readable.
- Verifies second feedback replaces the same user/article record through the existing repository contract.

- [ ] **Step 1: 写会失败的完整文章和打印测试**

```ts
it("loads every registered article source", async () => {
  for (const article of getHelpArticles()) {
    const document = await loadHelpArticle(article.slug);
    expect(document?.source.trim().length).toBeGreaterThan(20);
  }
});
```

Add PDF assertions for `pdf-print-document`, `导出 PDF`, `返回文章`, and the rich article content. Add a feedback test that submits `helpful: true` and then `helpful: false, comment: "需要补充截图"` for the same user and expects one updated record.

- [ ] **Step 2: 运行测试并观察尚未覆盖的失败**

Run: `pnpm vitest run tests/features/help-content.test.ts tests/features/help-pdf.test.tsx tests/features/help-feedback.test.tsx`

- [ ] **Step 3: 调整打印 CSS**

Inside `@media print`, force `.help-pdf-document`, `.help-document`, table cells, code and hint blocks to white background and dark text, hide `.help-pdf-controls`, and keep `break-inside: avoid` on media/table/code/blockquote.

- [ ] **Step 4: 运行测试确认通过并提交**

Run: `pnpm vitest run tests/features/help-content.test.ts tests/features/help-pdf.test.tsx tests/features/help-feedback.test.tsx`

```bash
git add tests/features/help-content.test.ts tests/features/help-pdf.test.tsx tests/features/help-feedback.test.tsx features/help-center/gitbook/pdf.css
git commit -m "test: protect the complete help center flow"
```

---

### Task 6: 本机完整验证

**Files:**
- Modify only if verification reveals a failure covered by a new failing test.

- [ ] **Step 1: Run all help tests**

Run: `pnpm vitest run tests/features/help-search.test.tsx tests/features/help-content.test.ts tests/features/help-navigation.test.tsx tests/features/help-pdf.test.tsx tests/features/help-document-view.test.tsx tests/features/help-feedback.test.tsx tests/app/help-pages.test.tsx tests/database/help-feedback-migration.test.ts`

- [ ] **Step 2: Run the full test suite**

Run: `pnpm test`

- [ ] **Step 3: Run type, lint and production build checks**

Run: `pnpm exec tsc --noEmit`

Run: `pnpm lint`

Run: `pnpm build`

- [ ] **Step 4: Run signed-out help protection**

Run: `pnpm exec playwright test tests/e2e/help-center.spec.ts`

- [ ] **Step 5: Inspect local desktop and mobile flows**

At 1440×900 and 390×844, inspect homepage, all categories, rich article, tabs, code copy, Mermaid, PDF embed, print route, feedback, mobile directory, page outline, previous/next and back-to-top. Save and inspect screenshots before accepting them.

- [ ] **Step 6: 如果验证揭露新问题，回到对应 Task 先写失败测试再修复**

Do not create an empty verification commit. Any real correction is committed with the exact test and production files from the task that owns the behavior.

---

### Task 7: Push, deploy and verify production

**Files:**
- No source change unless production exposes a reproducible bug with a failing test.

- [ ] **Step 1: Confirm repository state**

Run: `git status --short && git log -6 --oneline`

Expected: only the user-owned `audits/` folder may remain untracked.

- [ ] **Step 2: Push main**

Run: `git push origin main`

- [ ] **Step 3: Wait for `https://tasklb.vercel.app` to show the pushed version**

Open `/help` and verify the new “最近更新” section and non-empty 8 categories before continuing.

- [ ] **Step 4: Submit one real Tony feedback record**

Open a readable article, click `有帮助`, wait for `谢谢你的反馈。`, then make a read-only Supabase count check confirming at least one row exists.

- [ ] **Step 5: Recheck all 21 acceptance items on production**

Repeat computer and mobile checks. The rich article must open, back-to-top must set the article reading area to zero, and the component example article must show every rich block without an error page.

- [ ] **Step 6: Update the audit report with final evidence**

Change each 21-item status only when the production interaction proves it. Keep any remaining limitation visible instead of claiming completion.
