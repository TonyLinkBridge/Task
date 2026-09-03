# JUYU Internal Help Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 JUYU 工作台内部加入采用 GitBook 前台代码的完整帮助中心，并让设计规格中的 21 项功能全部可以实际使用。

**Architecture:** 帮助文章保存在本项目的 MDX 文件中，由服务器端文章资料层建立目录、搜索资料和前后文章关系。GitBook 的目录、页面、搜索、反馈、PDF 和 DocumentView 前台组件会复制到独立范围并去除 GitBook 云端依赖，再接上现有 Clerk、Supabase、主题与工作台外壳。

**Tech Stack:** Next.js 16、React 19、TypeScript、Tailwind CSS 4、Base UI、Clerk、Supabase、MDX、KaTeX、Mermaid、Vitest、Playwright。

**Spec:** `docs/superpowers/specs/2026-09-03-internal-help-center-design.md`

## Global Constraints

- 直接采用的 GitBook 前台代码只限规格列出的 21 项，并放在 `features/help-center/gitbook/`。
- 不连接 GitBook 云端、账号、后台、AI、广告、统计、Cookie 或 OpenAPI。
- 保留 GitBook 来源、GPLv3 授权和修改说明。
- `/help` 继续使用现有 Clerk 与 Slack Workspace 登录保护。
- 所有用户文案使用白话中文。
- 不改变现有任务、内容排期、审核、通知和 Slack 行为。
- 每一个产品改动都先写会失败的测试，再写实现。

---

### Task 1: 文章资料层和 GitBook 来源边界

**Files:**
- Create: `features/help-center/content/types.ts`
- Create: `features/help-center/content/registry.ts`
- Create: `features/help-center/content/loader.ts`
- Create: `content/help/getting-started/welcome.mdx`
- Create: `content/help/content-scheduling/create-content.mdx`
- Create: `content/help/content-review/submit-review.mdx`
- Create: `tests/features/help-content.test.ts`
- Create: `THIRD_PARTY_NOTICES.md`
- Create: `licenses/GitBook-GPL-3.0.txt`
- Modify: `package.json`

**Interfaces:**
- Produces: `HelpArticle`, `HelpCategory`, `getHelpArticles()`, `getHelpArticle(slug)`, `getHelpNavigation()` and `getAdjacentArticles(slug)`.
- Consumes: local MDX files only.

- [ ] **Step 1: Write the failing content-registry test**

```ts
import { describe, expect, it } from "vitest";
import { getAdjacentArticles, getHelpNavigation } from "@/features/help-center/content/registry";

describe("help content registry", () => {
  it("groups articles and preserves configured order", () => {
    const navigation = getHelpNavigation();
    expect(navigation[0]?.title).toBe("新员工入门");
    expect(navigation.find((group) => group.title === "内容排期")?.articles[0]?.title)
      .toBe("如何建立内容排期");
  });

  it("returns the previous and next article", () => {
    expect(getAdjacentArticles("内容排期/建立内容").next?.slug)
      .toBe("内容审核/提交审核");
  });
});
```

- [ ] **Step 2: Run the focused test and confirm it fails because the registry is missing**

Run: `pnpm test tests/features/help-content.test.ts`

- [ ] **Step 3: Add the MDX dependencies and typed registry**

Add `@mdx-js/mdx`, `next-mdx-remote`, `gray-matter`, `remark-gfm`, `remark-math`, `rehype-katex`, `katex`, `mermaid` and `shiki`. Define the eight ordered categories from the spec and reject duplicate slugs at startup.

- [ ] **Step 4: Add three real starter articles and license notices**

Each MDX file must have `title`, `description`, `category`, `order`, `cover`, `tags`, and `updatedAt`. Copy the complete GitBook GPLv3 license and list every later copied GitBook source path in `THIRD_PARTY_NOTICES.md`.

- [ ] **Step 5: Run the test and typecheck**

Run: `pnpm test tests/features/help-content.test.ts && pnpm exec tsc --noEmit`

- [ ] **Step 6: Commit**

```bash
git add package.json pnpm-lock.yaml content/help features/help-center/content tests/features/help-content.test.ts THIRD_PARTY_NOTICES.md licenses/GitBook-GPL-3.0.txt
git commit -m "feat: add help center content registry"
```

### Task 2: 帮助中心外壳、首页和三栏文章页面

**Files:**
- Create: `app/(protected)/help/layout.tsx`
- Create: `app/(protected)/help/page.tsx`
- Create: `app/(protected)/help/[...slug]/page.tsx`
- Create: `features/help-center/components/help-header.tsx`
- Create: `features/help-center/components/help-home.tsx`
- Create: `features/help-center/components/help-layout.tsx`
- Create: `features/help-center/gitbook/announcement.tsx`
- Create: `features/help-center/gitbook/footer.tsx`
- Create: `features/help-center/gitbook/page-cover.tsx`
- Create: `features/help-center/gitbook/page-tags.tsx`
- Modify: `components/app-shell/app-sidebar.tsx`
- Test: `tests/app/help-pages.test.tsx`
- Test: `tests/components/app-sidebar.test.tsx`

**Interfaces:**
- Consumes: article and category APIs from Task 1.
- Produces: protected `/help` and `/help/[...slug]` pages.

- [ ] **Step 1: Write failing route and sidebar tests**

```tsx
expect(screen.getByRole("link", { name: "帮助中心" }))
  .toHaveAttribute("href", "/help");
expect(screen.getByRole("heading", { name: "有什么可以帮到你？" })).toBeInTheDocument();
expect(screen.getByTestId("help-three-column-layout")).toBeInTheDocument();
```

- [ ] **Step 2: Run the tests and confirm the old external link and missing pages fail**

Run: `pnpm test tests/app/help-pages.test.tsx tests/components/app-sidebar.test.tsx`

- [ ] **Step 3: Adapt the selected GitBook page shell**

Copy and adapt layout markup from GitBook `Announcement`, `PageBody`, `PageCover`, `PageTags`, and `Footer`. Replace GitBook context objects with `HelpArticle` and current theme variables.

- [ ] **Step 4: Build the home page and article grid**

Desktop columns: `15rem minmax(0, 48rem) 13rem`. The middle article stays centered; the left and right columns are sticky below the current 72px header.

- [ ] **Step 5: Change the sidebar link to `/help` and run tests**

Run: `pnpm test tests/app/help-pages.test.tsx tests/components/app-sidebar.test.tsx`

- [ ] **Step 6: Commit**

```bash
git add app/'(protected)'/help components/app-shell/app-sidebar.tsx features/help-center/components features/help-center/gitbook tests/app/help-pages.test.tsx tests/components/app-sidebar.test.tsx
git commit -m "feat: add internal help center pages"
```

### Task 3: 目录、面包屑、本页目录和手机导航

**Files:**
- Create: `features/help-center/gitbook/table-of-contents.tsx`
- Create: `features/help-center/gitbook/mobile-navigation.tsx`
- Create: `features/help-center/gitbook/page-aside.tsx`
- Create: `features/help-center/gitbook/breadcrumbs.tsx`
- Create: `features/help-center/gitbook/page-footer-navigation.tsx`
- Create: `features/help-center/gitbook/scroll-to-top.tsx`
- Create: `features/help-center/content/headings.ts`
- Test: `tests/features/help-navigation.test.tsx`

**Interfaces:**
- Consumes: `getHelpNavigation()`, `getAdjacentArticles()` and parsed article headings.
- Produces: left navigation, mobile drawer, breadcrumb, outline and scroll controls.

- [ ] **Step 1: Write failing navigation tests**

```tsx
expect(screen.getByRole("navigation", { name: "文章目录" })).toBeInTheDocument();
expect(screen.getByRole("navigation", { name: "面包屑" })).toHaveTextContent("帮助中心内容排期提交审核");
expect(screen.getByRole("link", { name: "下一篇：提交审核" })).toBeInTheDocument();
expect(screen.getByRole("button", { name: "回到顶部" })).toBeInTheDocument();
```

- [ ] **Step 2: Verify the test fails**

Run: `pnpm test tests/features/help-navigation.test.tsx`

- [ ] **Step 3: Adapt GitBook navigation components**

Copy the relevant structure from `TableOfContents`, `PagesList`, `PageAside`, `ScrollSectionsList`, `BreadcrumbItemDropdown`, `PageFooterNavigation`, and `ScrollToTopButton`. Replace GitBook page APIs with Task 1 registry data and Base UI drawer behavior.

- [ ] **Step 4: Add heading extraction and active-section tracking**

`extractHelpHeadings(source)` returns `{ id, text, level }[]`; duplicate headings receive stable `-2`, `-3` suffixes. IntersectionObserver marks the current section without changing the URL history.

- [ ] **Step 5: Run navigation tests at desktop and mobile sizes**

Run: `pnpm test tests/features/help-navigation.test.tsx`

- [ ] **Step 6: Commit**

```bash
git add features/help-center/gitbook features/help-center/content/headings.ts tests/features/help-navigation.test.tsx
git commit -m "feat: add help article navigation"
```

### Task 4: GitBook 文章显示组件

**Files:**
- Create: `features/help-center/gitbook/document-view.tsx`
- Create: `features/help-center/gitbook/code-block.tsx`
- Create: `features/help-center/gitbook/copy-code-button.tsx`
- Create: `features/help-center/gitbook/hint.tsx`
- Create: `features/help-center/gitbook/tabs.tsx`
- Create: `features/help-center/gitbook/media.tsx`
- Create: `features/help-center/gitbook/file-card.tsx`
- Create: `features/help-center/gitbook/pdf-embed.tsx`
- Create: `features/help-center/gitbook/math.tsx`
- Create: `features/help-center/gitbook/mermaid.tsx`
- Create: `features/help-center/gitbook/document.css`
- Create: `features/help-center/content/mdx-components.tsx`
- Test: `tests/features/help-document-view.test.tsx`

**Interfaces:**
- Consumes: compiled MDX source.
- Produces: `HelpDocumentView`, `Hint`, `Tabs`, `Video`, `FileCard`, `PdfEmbed`, `MermaidDiagram` and safe link/media renderers.

- [ ] **Step 1: Write one failing test for every supported block family**

```tsx
expect(screen.getByRole("table")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "复制代码" })).toBeInTheDocument();
expect(screen.getByRole("tab", { name: "员工" })).toBeInTheDocument();
expect(screen.getByLabelText("流程图")).toBeInTheDocument();
expect(screen.getByText("x² + y²")).toBeInTheDocument();
```

- [ ] **Step 2: Verify the tests fail because the renderers are missing**

Run: `pnpm test tests/features/help-document-view.test.tsx`

- [ ] **Step 3: Adapt GitBook DocumentView blocks**

Use the source structure from GitBook `DocumentView`, `Hint`, `Images`, `Embed`, `File`, `Table`, `Tabs`, `Math`, and `CodeBlock`. Remove GitBook API context, integrations, AI and OpenAPI branches. Keep GitBook keyboard, focus and responsive behavior where applicable.

- [ ] **Step 4: Add secure MDX component mapping**

Only the explicitly registered components can run. Raw HTML is disabled. External links receive `target="_blank" rel="noopener noreferrer"`; iframe sources allow only HTTPS and an allowlist of supported video providers.

- [ ] **Step 5: Add graceful failures**

Invalid Mermaid, video, file or PDF blocks render a bordered Chinese error card instead of throwing the article page.

- [ ] **Step 6: Run focused tests and commit**

Run: `pnpm test tests/features/help-document-view.test.tsx`

```bash
git add features/help-center/gitbook features/help-center/content/mdx-components.tsx tests/features/help-document-view.test.tsx
git commit -m "feat: render rich help articles"
```

### Task 5: 帮助文章搜索和全系统搜索

**Files:**
- Create: `features/help-center/search/index.ts`
- Create: `features/help-center/gitbook/search-input.tsx`
- Create: `features/help-center/gitbook/search-results.tsx`
- Create: `app/(protected)/help/search/page.tsx`
- Modify: `features/search/repository.ts`
- Modify: `features/search/components/global-search.tsx`
- Modify: `features/search/global-search-handler.ts`
- Test: `tests/features/help-search.test.tsx`
- Test: `tests/features/global-search.test.ts`

**Interfaces:**
- Produces: `searchHelpArticles(query)` and a global result with `type: "help"`.
- Consumes: normalized article title, description, tags and plain-text body.

- [ ] **Step 1: Write failing search tests**

```ts
expect(searchHelpArticles("提交审核")[0]?.slug).toBe("内容审核/提交审核");
expect(searchHelpArticles("不存在的内容")).toEqual([]);
```

- [ ] **Step 2: Verify failure, then adapt GitBook Search UI**

Run: `pnpm test tests/features/help-search.test.tsx tests/features/global-search.test.ts`

Adapt GitBook `SearchInput`, `SearchResults`, `HighlightQuery`, keyboard cursor and empty result behavior. Remove AI ask, remote scope and GitBook server actions.

- [ ] **Step 3: Add local ranking and highlighting**

Exact title match ranks first, then title prefix, tags, description and body. Escape the query before highlighting so user input cannot become HTML.

- [ ] **Step 4: Add help results to the existing global search**

Update the result union to `"task" | "content" | "help"` and label help results as“帮助文章”.

- [ ] **Step 5: Run tests and commit**

```bash
git add app/'(protected)'/help/search features/help-center/search features/help-center/gitbook/search-* features/search tests/features/help-search.test.tsx tests/features/global-search.test.ts
git commit -m "feat: search help articles"
```

### Task 6: “这篇文章有帮助吗？”反馈

**Files:**
- Create: `supabase/migrations/202609030001_help_article_feedback.sql`
- Create: `features/help-center/feedback/repository.ts`
- Create: `features/help-center/feedback/actions.ts`
- Create: `features/help-center/gitbook/page-feedback.tsx`
- Test: `tests/database/help-feedback-migration.test.ts`
- Test: `tests/features/help-feedback.test.tsx`

**Interfaces:**
- Produces: `saveHelpFeedback({ articleSlug, helpful, comment })`.
- Consumes: current verified Clerk user ID.

- [ ] **Step 1: Write failing migration and behavior tests**

```tsx
await user.click(screen.getByRole("button", { name: "没帮助" }));
expect(screen.getByLabelText("哪里不清楚？")).toBeInTheDocument();
```

The migration test must prove a unique `(article_slug, clerk_user_id)` record and an update-on-second-vote policy.

- [ ] **Step 2: Verify tests fail**

Run: `pnpm test tests/database/help-feedback-migration.test.ts tests/features/help-feedback.test.tsx`

- [ ] **Step 3: Add the table, secure server action and adapted feedback UI**

Adapt GitBook `PageFeedbackForm`, replace Insights tracking with the Supabase repository, use two ratings, and allow an optional 3–512 character explanation for “没帮助”.

- [ ] **Step 4: Run tests and commit**

```bash
git add supabase/migrations/202609030001_help_article_feedback.sql features/help-center/feedback features/help-center/gitbook/page-feedback.tsx tests/database/help-feedback-migration.test.ts tests/features/help-feedback.test.tsx
git commit -m "feat: collect help article feedback"
```

### Task 7: PDF 阅读、打印和导出

**Files:**
- Create: `app/(protected)/help/[...slug]/pdf/page.tsx`
- Create: `features/help-center/gitbook/pdf-print-controls.tsx`
- Create: `features/help-center/gitbook/pdf-root-layout.tsx`
- Create: `features/help-center/gitbook/pdf.css`
- Test: `tests/features/help-pdf.test.tsx`

**Interfaces:**
- Consumes: the same article loader and document renderer in print mode.
- Produces: printable article route and native PDF/file embed.

- [ ] **Step 1: Write failing print-layout tests**

```tsx
expect(screen.getByRole("button", { name: "导出 PDF" })).toBeInTheDocument();
expect(screen.getByTestId("pdf-print-document")).toHaveTextContent("提交内容给上司审核");
expect(screen.queryByTestId("app-sidebar")).not.toBeInTheDocument();
```

- [ ] **Step 2: Verify failure and adapt GitBook PDF components**

Run: `pnpm test tests/features/help-pdf.test.tsx`

Adapt GitBook `PDFRootLayout`, `PDFPrintControls`, `PrintButton`, page controls and `pdf.css`. Use `window.print()` so the browser can save a PDF without an external service.

- [ ] **Step 3: Verify tables, images, code and Mermaid remain visible in print mode**

Run: `pnpm test tests/features/help-pdf.test.tsx`

- [ ] **Step 4: Commit**

```bash
git add app/'(protected)'/help/'[...slug]'/pdf features/help-center/gitbook/pdf-* tests/features/help-pdf.test.tsx
git commit -m "feat: print and export help articles"
```

### Task 8: 响应式、无障碍和完整浏览器验收

**Files:**
- Create: `tests/e2e/help-center.spec.ts`
- Modify: `app/globals.css`
- Modify: affected help-center components from Tasks 2–7
- Modify: `THIRD_PARTY_NOTICES.md`

**Interfaces:**
- Consumes: all previous help center features.
- Produces: verified desktop/mobile help center with no regressions.

- [ ] **Step 1: Write failing Playwright journeys**

Test desktop: open `/help`, search, open article, navigate headings, switch tabs, submit feedback, open printable page.

Test mobile: open directory drawer, choose a child article, open the page outline, verify media and table do not widen the viewport.

- [ ] **Step 2: Run the browser test and record the real failures**

Run: `pnpm test:e2e tests/e2e/help-center.spec.ts`

- [ ] **Step 3: Fix only the observed responsive and accessibility gaps**

Ensure visible focus states, semantic navigation labels, 44px mobile targets, no horizontal page overflow, reduced-motion support and correct dark-mode contrast.

- [ ] **Step 4: Run the complete verification suite**

Run: `pnpm test`

Run: `pnpm exec tsc --noEmit`

Run: `pnpm lint`

Run: `pnpm build`

Run: `pnpm test:e2e tests/e2e/help-center.spec.ts tests/e2e/tasks.spec.ts tests/e2e/content-review.spec.ts`

- [ ] **Step 5: Compare all 21 acceptance items against screenshots at 1440px and 390px**

Every item must be demonstrated by a working control or rendered content. Update `THIRD_PARTY_NOTICES.md` with the final copied-file list.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css features/help-center tests/e2e/help-center.spec.ts THIRD_PARTY_NOTICES.md
git commit -m "test: verify complete help center experience"
```
