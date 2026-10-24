# Remaining page integration — 2026-10-24

Authority: `docs/superpowers/plans/2026-10-24-murmura-integration.md` and latest user request. Continue inline, no agents, no production changes, no push/deploy. Two distinct human Slack users: **skipped at the user's request**, not passed.

Ruling: Complete mappings to existing Task capabilities; do not invent platform metrics, external conversations, subscriptions or OAuth connections. Preserve source reference and notices. Page functionality and exact source visual/animation parity are separate acceptance tracks.

| Step | Scope | State |
| --- | --- | --- |
| 1 | Calendar week/month/list, platform/status filters and real content links | Complete within current mapping scope; component tests and browser checks |
| 2 | Shared navigation, account menu/search/notifications; distinct approvals and overview | Complete within current mapping scope; actual test records and account menu observed |
| 3 | Library using existing content attachments and preview/download | Complete within current mapping scope; image 640x360 loaded, downloaded bytes match fixture |
| 4 | Channels/platform administration, members and settings using existing permissions | Implemented; create/archive/restore and member list exercised; settings profile/notification/workspace/approval/security/billing/appearance read, data export content inspected |
| 5 | Ordinary tasks and help access; honest analytics/inbox/listening mappings | Implemented; ordinary task created; read-state/header synchronization verified; external capability gaps explicit |
| 6 | Browser acceptance, responsive/keyboard/motion checks and final gap table | Partial: desktop/theme functional checks passed; mobile override did not affect actual DOM viewport; exact transitions, complete pointer/keyboard states and help walkthrough remain unverified |

Pre-flight: canonical schedule queries already resolve approved-to-due and Malaysia dates. Employee approval restrictions remain in server actions. Attachment history is preserved; library must omit archived attachments/contents. Preview launcher currently excludes search/notification/task-file APIs and redirects `/tasks` away: fix the disposable harness before claiming those flows accepted.

Ruling: The preview now permits only the additional local search/notification/task/help/file routes needed for this acceptance. Its local query adapter gained parameterized ilike/or/contains support. Existing in-memory DB is reused on source sync, not reset. A generated-runtime syntax defect was observed in the older synthetic copy and repaired with a shared source generator and compile test.

Ruling: Preserve the existing Task and GitBook detail experiences where reused; do not claim their layouts are identical to Murmura. No source-parity pass or production promotion follows from the data mappings.

Ruling: Source parity and responsive testing are still open. The documented viewport override returned successfully but DOM widths stayed 1357/1280, so it did not establish 390px acceptance. Reset the override and leave this unverified instead of passing a desktop screenshot as mobile.

Verification: full suite 355/355, 101 files, one worker and 20s test/hook timeout after a resource-limited two-worker run timed out. After adding the content-delete return route, targeted marketing + delete tests 28/28 and whole-project TypeScript passed. Last code changes do not have a second full-suite result; no 356/356 full-suite claim.

Execution: no agents, commits, push, production keys, cloud DB migrations, Slack sends or deployment. Old reference (3217) and synthetic (3218) previews stopped after browser acceptance to reduce memory use; real-login preview 3219 retained. Two-human Slack collaboration is skipped by explicit user request.

### 2026-10-25: requested items 1–3

Mapped-page appearance, motion and browser-responsive acceptance completed for this pass. Source-derived overview/calendar styles, original runtime, mobile five-entry navigation and actual version-aware cover were added. The earlier mobile override limitation is resolved with a disposable same-origin viewport harness, not a successful-looking override setting. Evidence: `VISUAL_FINISH.md`, 39 width/page readings, same-size combined screenshots. Current targeted tests 50/50 and isolation checks 15/15; typecheck/lint pass. Physical devices and exhaustive original pixel/control parity remain unclaimed. Items 4–7 and two-human testing are skipped. Existing Task/Help behavior remains the mapping boundary; no agents or production operations.

### 2026-10-25: cross-page coordination polish

Current-request scope completed in the isolated worktree: scoped source color variables, shared heading/empty/account/button treatment, aligned task statistics, task detail chrome/return paths, library thumbnails and preserved internal private-message entry. Browser evidence covers mapped desktop pages, synthetic-admin panels, real-login content/editor display, image preview, 320/390px layout, mobile More and actual dark theme. Targeted regression 61/61 (17 files), local isolation tests 17/17; TypeScript, scoped lint and diff whitespace checks passed. See `POLISH_AUDIT.md`. Help retains its existing reader chrome, documented separately; physical devices and two-human collaboration remain unverified/skipped. Formal system untouched; no commit, push, deploy or Slack send. Synthetic3218 stopped, real3219 retained.

### 2026-10-25: help chrome and official Arc Select

Help home/article/search now share the new workbench, preserving original document components and clean PDF branch. Fifteen app-owned single selects now use the official MIT Arc source, original Radix/motion behavior and native form contracts; searchable platform multiselect remains intact. Independent local dependencies replace the previous link into the original checkout. Full suite378/378 before final mobile fix, final related41/41, final isolation19/19; type/lint pass. Browser checked search, article reading, anchors, feedback, mobile menu closure, dark theme, 320/390px layouts, actual task save/filter and keyboard/required/reset states. See `HELP_SELECT_ACCEPTANCE.md` for evidence and limitations. Production untouched; no commit/push/deploy/Slack/agents.

### 2026-10-25: original Dashboard work summaries integrated

All five original summary buckets now appear in Overview, using canonical task/content queries. Original and new pages were compared on the same local records:7/4/2/1/3 in both. Remaining items can be expanded beyond five, links open existing new-chrome details, empty states and Malaysia boundaries tested. Full suite385/385; final related8/8, type/lint/diff checks passed. Desktop/dark and320/390px local browser checks completed. See `OVERVIEW_DASHBOARD_ACCEPTANCE.md`. No production, account-permission or Slack operation; no Git publishing or agents.

### 2026-10-25: original Task page parity

Added admin-only global history, content board with original move rules, assignee/date filters and reset, approval counts, and correct new list destinations from search/notifications/details/delete. Preserved original task, content, file, review, platform and help components/actions. Added channel-list failure fallback. Browser exercised employee filters and saved board roundtrip, admin history, employee denial,320/390 widths and mobile employee More. Full394 passed before final approval-label patch; final related30/30, isolation20/20, types/lint pass. See `LEGACY_FEATURE_PARITY.md`. No production/cloud writes, Slack sends, agents or Git publishing; synthetic3218 stopped, real3219 retained.
