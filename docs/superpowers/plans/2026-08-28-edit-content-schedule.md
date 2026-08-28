# Edit Content Schedule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow authorized members to edit a content item's title, platforms, assignee, and Malaysia publish time without bypassing review.

**Architecture:** Add one transaction-safe Supabase RPC for schedule updates, expose it through the existing repository and server-action layers, and reuse the existing scheduling form with initial values on the content detail page. The database remains the final authority for status and actor permission, and updates the linked publish task in the same transaction.

**Tech Stack:** Next.js 16 server actions, React 19, TypeScript, Zod, Supabase/PostgreSQL, Vitest, Testing Library, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-08-28-edit-content-schedule-design.md`

## Global Constraints

- Only `draft` and `changes_requested` content is editable.
- An employee must be the existing author or assignee; an admin may edit any editable content.
- At least one active platform and one active assignee are required.
- Malaysia time is converted to an ISO instant before the server action runs.
- Content and linked task updates must be atomic.
- Do not reschedule Slack deliveries in this plan; task 16 owns that behavior.
- Preserve the unrelated untracked `audits/` directory.

---

### Task 1: Transaction-safe schedule update RPC

**Files:**
- Create: `supabase/migrations/202608280010_update_content_schedule.sql`
- Create: `tests/features/content/update-schedule-rpc.test.ts`

**Interfaces:**
- Consumes: existing `contents`, `content_platforms`, `platforms`, `profiles`, `tasks`, and `audit_events` tables.
- Produces: `update_scheduled_content(uuid, text, text, text, timestamptz, uuid[]) returns contents`.

- [ ] **Step 1: Write failing RPC tests**

Create tests that call `update_scheduled_content` and assert the content row, selected platform rows, linked task title/assignee/due time, and `content_updated` audit before/after data. Add rejection cases for `in_review`, an unrelated employee, an archived assignee, and an archived or empty platform selection.

- [ ] **Step 2: Run the RPC test and verify RED**

Run: `pnpm vitest run tests/features/content/update-schedule-rpc.test.ts`

Expected: FAIL because migration `202608280010_update_content_schedule.sql` and function `update_scheduled_content` do not exist.

- [ ] **Step 3: Implement the migration**

The function must lock the content row, validate the current status and actor, validate active assignee/platform IDs, update `contents`, replace `content_platforms`, update the linked task, insert one `content_updated` audit event, revoke public execution, and grant execution only to `service_role` when that role exists.

- [ ] **Step 4: Run the RPC test and verify GREEN**

Run: `pnpm vitest run tests/features/content/update-schedule-rpc.test.ts`

Expected: PASS.

### Task 2: Repository and server action

**Files:**
- Modify: `features/content/repository.ts`
- Modify: `features/content/action-service.ts`
- Modify: `features/content/actions/content.ts`
- Modify: `tests/features/content/repository.test.ts`
- Modify: `tests/features/content/actions.test.ts`

**Interfaces:**
- Consumes: `ContentInput`, verified Clerk user ID, and the new RPC.
- Produces: `contentRepository.updateSchedule(contentId, input, actorId)` and server action `updateScheduledContent(contentId, input)`.

- [ ] **Step 1: Write failing repository and action tests**

Assert the repository sends all six RPC parameters. Assert the action rejects an invalid content ID/input, uses the verified user as actor, and refreshes both `/content` and `/content/{id}` after success.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `pnpm vitest run tests/features/content/repository.test.ts tests/features/content/actions.test.ts`

Expected: FAIL because `updateSchedule` and `updateScheduledContent` do not exist.

- [ ] **Step 3: Implement repository and action wiring**

Use `z.uuid()` for the content ID and the existing `contentInputSchema` for the four fields. Return the existing plain Chinese validation and temporary failure result shapes.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `pnpm vitest run tests/features/content/repository.test.ts tests/features/content/actions.test.ts`

Expected: PASS.

### Task 3: Reusable prefilled schedule form

**Files:**
- Modify: `features/content/components/content-form.tsx`
- Modify: `features/content/components/content-form-page.tsx`
- Modify: `tests/features/content/content-form.test.tsx`

**Interfaces:**
- Consumes: optional `initialValues: ContentInput`, configurable button/help text, and a generic save action.
- Produces: the existing creation form behavior plus a prefilled editing mode that submits the same `ContentInput` shape.

- [ ] **Step 1: Write a failing prefilled form test**

Render with existing title/platform/assignee/publish time, assert all controls are prefilled, change every field, submit, and assert the Malaysia-time ISO payload.

- [ ] **Step 2: Run the form test and verify RED**

Run: `pnpm vitest run tests/features/content/content-form.test.tsx`

Expected: FAIL because the form always starts empty and has fixed creation copy.

- [ ] **Step 3: Generalize the form minimally**

Add optional initial values and copy props while preserving creation defaults. Convert ISO publish time to `YYYY-MM-DDTHH:mm` in `Asia/Kuala_Lumpur`.

- [ ] **Step 4: Run the form test and verify GREEN**

Run: `pnpm vitest run tests/features/content/content-form.test.tsx`

Expected: PASS.

### Task 4: Detail-page edit panel

**Files:**
- Create: `features/content/components/content-schedule-editor.tsx`
- Create: `tests/features/content/content-schedule-editor.test.tsx`
- Modify: `app/(protected)/content/[contentId]/page.tsx`

**Interfaces:**
- Consumes: current `ContentRecord`, selected platform IDs, active platforms, assignees, and `updateScheduledContent`.
- Produces: an “编辑排期资料” toggle that saves, closes, and refreshes the page.

- [ ] **Step 1: Write failing component tests**

Assert the panel is initially closed, opens with current values, saves through `updateScheduledContent`, closes after success, and is absent when the page does not authorize schedule editing.

- [ ] **Step 2: Run the component test and verify RED**

Run: `pnpm vitest run tests/features/content/content-schedule-editor.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement and connect the edit panel**

Render it only when the effective status is `draft` or `changes_requested` and the current user is an admin, author, or assignee. Keep the read-only summary visible above the editor.

- [ ] **Step 4: Run component and page-related tests and verify GREEN**

Run: `pnpm vitest run tests/features/content/content-schedule-editor.test.tsx tests/features/content/content-form.test.tsx`

Expected: PASS.

### Task 5: Full verification, production database, and task table

**Files:**
- Modify: `docs/completion-task-table.md`

**Interfaces:**
- Consumes: all completed feature work.
- Produces: migrated production database, deployed application, and task 15 marked complete.

- [ ] **Step 1: Run full verification**

Run: `pnpm test && pnpm lint && pnpm build`

Expected: all test files pass, lint has no findings, and Next.js production build succeeds.

- [ ] **Step 2: Apply migration 010 to the selected Supabase project**

Execute the exact contents of `supabase/migrations/202608280010_update_content_schedule.sql` once and verify `update_scheduled_content` exists.

- [ ] **Step 3: Mark task 15 complete and push main**

Change task 15 from `未完成` to `完成`, commit only task-related files, and push `main` so Vercel deploys.

- [ ] **Step 4: Verify production page**

Open an editable content detail page, confirm the edit panel loads current data, and verify a non-destructive save only when it will not send a Slack review notification. Confirm the page still loads if a safe production save is not available.
