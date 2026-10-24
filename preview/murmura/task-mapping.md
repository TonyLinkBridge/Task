# Existing Task functionality → Murmura surfaces

All destinations below refer to the existing application in the same repository. None is called by the static reference server. Current connected-route acceptance is recorded in `PAGE_ACCEPTANCE.md`; earlier wording below describes the initial mapping checkpoint.

| Surface | Existing implementation | Required connection work |
| --- | --- | --- |
| Overview / Calendar | `features/schedule/queries.ts`, `features/schedule/query-service.ts` | Use canonical content status and preserve due vs published; replace demo counts with actual queries |
| Compose | `features/content/actions/content.ts`, `features/content/components/content-form.tsx` | Create/update schedule with original validation and author permissions; preserve Malaysia time |
| Body / inline review | `features/content/components/blocknote-editor.tsx`, `content-editor-review.tsx`, `snapshot-viewer.tsx` | Keep collaborative draft and fixed submitted version separate; retain inline comments |
| Approval / request changes | `features/approval/actions.ts`, `action-service.ts`, `rules.ts` | Call `submitForReview(contentId, blocknoteJson, requestedReviewerId)`, `approveContent(contentId, version)`, `requestChanges(contentId, version, message)`; no direct demo mutation |
| Publication | `markPublished(contentId)` in existing approval actions | Manual record remains distinct from actual platform publishing; never promote a countdown into proof of publication |
| Delete | `deleteScheduledContent(contentId)` | Existing author/admin and storage/history cleanup rules stay authoritative |
| Library / attachments | `features/content/files/actions.ts`, `components/attachments.tsx` | Reuse upload validation and attachment/version IDs; global reusable library needs additional model |
| General comments | `features/content/actions/comments.ts`, `components/content-chat.tsx` | Existing permissions and refresh/synchronization behavior |
| Team / settings | `features/admin/**`, `lib/auth/get-verified-user.ts` | Existing Clerk IDs and employee/admin roles; do not allow demo account switching to create access |
| Search / notifications | `features/search/**`, `features/notifications/**` | Real query scopes and existing read state; Slack delivery stays inside existing service |
| Tasks | `features/tasks/**`, `/tasks` | Keep existing general task board and content-linked publication restrictions in new navigation |
| Help | `features/help-center/**`, `/help` | Keep actual help articles, search, navigation and feedback |
| External Inbox | No equivalent in internal private messages | New external source/reply service; internal communication remains separate |
| Social Analytics / Listening | No equivalent to the demo's platform metrics | Need explicit real sources, authorization and reliable refresh/error behavior |
| Connected Channels | Custom platforms provide IDs/name/color, not OAuth accounts | New connection model; include Telegram, which original demo does not expose |
| Billing / Security simulation | Existing Clerk authenticates; no demo subscription service | Preserve UI as isolated demonstration until actual product scope is confirmed |

## Mapping acceptance already tested

1. Content and schedule records must describe the same item/status/date/assignee; stale mismatches fail visibly.
2. Only active approvals for this content and current version count; duplicate admins count once.
3. Pending content stays pending when time passes; only already-approved content may become due.
4. UTC instants remain unchanged while input dates render in Asia/Kuala_Lumpur, including midnight boundaries.
5. Arbitrary custom platforms stay custom; connection status is unknown and no social account or metric is invented.
6. Archived records are omitted; identifiers are safely encoded into existing Task routes.

Current legacy parity findings and fixes: see `LEGACY_FEATURE_PARITY.md` (2026-10-25).

## Current connected routes

| Route | Mapping | Acceptance boundary |
| --- | --- | --- |
| `/marketing` | Actual content totals, review/due/published counts and next work | Existing schedule queries, no audience simulation |
| `/marketing/content/new`, `/marketing/content/[id]` | Canonical creation, body, review, comments, files, publish record and delete | Prior collaboration acceptance plus current delete-return regression; actual platform delivery remains absent |
| `/marketing/calendar` | Week/month/list with custom platform/status filters | Malaysia dates and current IDs; no simulated drag-to-publish |
| `/marketing/approvals` | Current in-review records and version progress | Open actual review controls; no one-click bypass |
| `/marketing/library` | Current active content attachments, search/type filter, image preview and download | Existing attachment IDs and history rules; independent folders/reusable asset model absent |
| `/marketing/channels` | Existing customizable platforms | Employee read-only; administrator canonical create/edit/archive/restore; OAuth connections absent |
| `/marketing/team` | Existing members and roles | View only; roles are never changed by demo UI |
| `/marketing/tasks` | Existing board, filters, create/update/move and import/export | Ordinary and content-linked task rules preserved; detail links retain existing Task pages |
| `/marketing/inbox` | Recipient-scoped station notifications and saved read state | External social conversations/replies absent |
| `/marketing/analytics` | Actual internal content status/platform totals | Followers, reach, sentiment and engagement absent |
| `/marketing/listening` | Explicit capability gap and ordinary-task alternative | External monitoring absent, not accepted as implemented |
| `/marketing/settings/…` | Profile, notifications, workspace, approvals, security, billing, appearance, data | Existing data/actions where available; password/2FA/billing simulations excluded |
| `/marketing/history` | Original global delivery/audit history and failed-only retry | Admin entry and server query guard; real Slack transmission not exercised in isolation |
| Shared header/dock | Search, notifications, account/sign-out, all routes, original help | Search results/content notifications map to the new content routes; help preserves its existing GitBook UI |

These routes adapt the supplied visual reference to existing Task behavior. Complete original nested-state/drag/drawer/chart parity and identical page-transition animation have **not** been accepted. A reachable page is not evidence that its absent external service exists.
