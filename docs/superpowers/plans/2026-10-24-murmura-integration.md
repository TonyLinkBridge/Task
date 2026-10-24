# Murmura Integration Implementation Plan

> Execute inline, without agents. User confirmed the direction and explicitly instructed proceeding directly on 2026-10-24. Their instruction overrides further skill approval gates; it does not establish third-party ownership or licensing. Preserve source notices. No push, deployment or production changes.

**Goal:** Bring the observed Murmura frontend experience into Task, then map its actions to Task's existing canonical services in an isolated development environment.

**Architecture:** Reuse the publicly delivered frontend resources to preserve the actual layout and GSAP timelines rather than inventing approximations. Keep those resources together, attributed and versioned. A loopback-only read-only preview serves exclusively local assets and demo state; separately typed adapters map Task content, approval counts, members, files and actions, without letting demo role switching or state mutations bypass real server permissions.

**Tech Stack:** Existing Next.js/TypeScript repository; original browser-delivered ES modules/CSS/GSAP; Node native preview and tests. No new dependencies required for the preview.

**Spec:** `docs/superpowers/specs/2026-10-24-murmura-integration-design.md`.

## Constraints

- Base: GitHub main `bc67d9c85ff7f6f17a54b085951f76f2a9ec5e42`, verified via ls-remote; isolated worktree created with the native tool.
- Preserve existing uncommitted n8n work; canceled integration is not imported or resumed.
- Do not read or copy production env files, send Slack notifications, authorize platforms, migrate production data, change production Clerk/Liveblocks or deploy. The subsequent content-integration request authorizes new test content rooms in the previously designated Liveblocks development project; no project settings or production rooms are changed.
- Original demo simulations are not real publishing, identity security, analytics or listening. Label preview mode; prohibit any automatic promotion of demo data into real services.
- Keep third-party copyright notices and origin/hash manifests. Actual distribution is outside current scope.
- Existing employee content requires two distinct admins; original demo's one-click approval cannot be wired directly to real content.

## Tasks

### 1. Source and animation inventory
- [x] Capture main pages and source resource inventory in the in-app browser.
- [x] Record settings subpages and actual GSAP route/drawer animation definitions.
- [ ] Capture remaining key child states, mobile, dark mode and keyboard behavior.
- [x] Download all observed/explicitly referenced assets, localize fonts and verify no hotlinks.

### 2. Isolated complete frontend preview
Files: `scripts/murmura-preview.mjs`, `preview/murmura/site/**`, `preview/murmura/THIRD_PARTY_NOTICES.md`, `tests/marketing/preview-server.test.mjs`.
- [x] Add failing test proving reads only, no API/writes/env or traversal.
- [x] Serve original layout, all eleven primary pages and their lazy-loaded modules from loopback only.
- [x] Verify page/navigation/drawer/calendar/theme and local draft persistence in browser.
- [x] Compare source and preview at the same desktop/mobile sizes; save screenshots and `design-qa.md` with honest limits.

### 3. Typed Task mapping
Files: `features/marketing/task-adapter.mts`, `tests/marketing/task-adapter.test.mjs`, `preview/murmura/task-mapping.md`.
- [x] Tests: preserve ID, author/assignee distinction, Malaysia time, stored vs due status, original version and two-admin progress; duplicate approvals never count twice.
- [x] Map Task's content/schedule/platform/member structures into a separate view model; never pretend that a platform label is an authenticated account or social metric.
- [x] Map existing routes and actions in `task-mapping.md`; unknown original-demo metrics stay explicitly unavailable. This is a map, not a wired frontend.

### 4. Actual Task integration and service replacement
- [x] Build content list/create/detail replacement routes/shell in the isolated Next app, using current canonical queries/actions. Other module routes remain separate work.
- [x] Connect and locally exercise content editing, two distinct admin approvals, fixed versions, anchored comments, ordinary comments, uploads and image preview. Evidence/limitations: `preview/murmura/CONNECTED_ACCEPTANCE.md`.
- [x] Add collaboration failure notice and reconnect so a failed optimistic comment is not presented as confirmed storage.
- [ ] Replace original demo actions individually: save, submit, approve, request changes, publish record, delete, comments, files, notifications, sign-out.
- [ ] Keep ordinary tasks, help and inline comments accessible, with server-enforced permissions.
- [ ] Do not expose demo login/account-switch/role editor or simulation publishing as real operations.
- [x] Test the requested content workflow with synthetic identities, temporary local SQL/files and the designated Liveblocks development project only. Real Clerk/Slack and hosted Supabase transport acceptance remains outstanding.

### 5. New external capabilities
- [ ] Separate implementation/acceptance for external inbox, social metrics, listening, connected accounts and real platform delivery; must have actual platform evidence.
- [ ] Local demo Billing/Security screens stay simulation until an actual service is explicitly selected; no real charge/security changes authorized.

## Review focus

### Page mapping continuation checkpoint

`preview/murmura/PAGE_INTEGRATION_PROGRESS.md` is the continuation ledger. Calendar/approvals/overview/library/channels/team/tasks/notification inbox/settings routes now map to existing services; header search, notifications, account/sign-out and help entry are retained. Full Vitest pass: 355/101 files; subsequent delete-return change has 28 passing targeted tests and whole-project typecheck. Native isolated checks: 15 passed. Browser evidence and intentionally unavailable capabilities are in `PAGE_ACCEPTANCE.md`. Two-human collaboration is explicitly skipped; original exact layout/transition/mobile acceptance remains open. No agent, commit, production change or deployment.

1. Demo account switching must not grant Task permissions.
2. Status mapping must preserve in-review vs approved vs due vs published and historical versions.
3. Draft/review actions must never publish or send real Slack messages from preview.
4. Original frontend dependencies/assets must all load locally on mobile and after refreshing nested hash routes.
5. Source parity and actual connected-product readiness are reported separately.

### Visual/motion/mobile continuation — 2026-10-25

Latest user restricted the work to appearance, motion and mobile, with external items 4–7 skipped. Completed the connected-page checkpoint described in `preview/murmura/VISUAL_FINISH.md`; it supersedes the prior inability to measure mobile CSS widths. Original exact pixel/control parity and physical-device acceptance are not claimed. Tests: 50 targeted, 15 isolation, whole-project types and scoped lint. No production operations, agents, commit, push or deployment.
