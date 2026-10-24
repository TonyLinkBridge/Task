# Recovery and real-login checkpoint — 2026-10-24

## Isolation boundary

Changes are uncommitted in the `codex/murmura-integration` worktree. Nothing has been pushed or deployed. Production Clerk, Slack app, Supabase and Liveblocks were not changed.

The synthetic workflow preview runs at loopback port 3218 with three explicitly labeled synthetic identities, local SQL and files. The real-login preview runs separately at loopback port 3219 with canonical Clerk/Slack identity verification, no synthetic login route and no seeded users. Both use only the designated Liveblocks development project `6a91c42f2636d77aa4a4f4eb`. No notification worker runs and no Slack messages are sent.

## Confirmed repairs

1. **Temporary collaboration failures were returned as permanent permission denial.** Authorization now distinguishes unauthenticated (401), confirmed forbidden (403) and unavailable dependencies (503). Temporary database, identity lookup and collaboration-service failures do not become a permanent SDK retry stop. Invalid rooms, absent content and wrong workspace remain denied. Logs contain only stage and safe reason identifiers. The exact upstream cause of the earlier individual transient failure is not confirmed.
2. **Review-to-edit changes retained a stale room session.** The new workspace remounts its collaboration provider when editability changes. A lifecycle regression test failed before the change and passes after it. In the browser, an employee submitted version 3, an administrator opened read-only review and requested changes, then administrator-to-employee and employee-to-administrator edits synchronized without reloading either page.
3. **Original type-check failure.** Removed an unnecessary mock spread and `as never` cast in the notification settings test that erased contextual typing. Whole-project type checking passes; notification behavior is unchanged.
4. **An expired Slack sign-in attempt could silently do nothing and leave the button spinning.** The installed Clerk SDK returned no error but retained an expired attempt with no redirect URL. Retrying now resets that attempt and waits for the replacement resource before invoking SSO; invoking SSO on the discarded resource also does nothing. The button waits for SDK readiness and reports failure instead of remaining indefinitely in its opening state. This change has regression coverage and the actual browser now reaches the dedicated Slack test consent page.
5. **Test entry after OAuth could remain on the streamed root redirect.** The callback established a valid session, but the browser stayed rendering `/`; navigating directly to `/marketing` succeeded. The test-only middleware now redirects authenticated root requests before rendering, retaining Clerk session headers and preserving unauthenticated/upstream redirects. Browser navigation to `/` now lands on `/marketing`. This does not change the production callback.
6. **Other open review pages retained old status.** A completed review operation originally refreshed only its own page. The marketing wrapper now broadcasts an empty room invalidation event after success; peers refetch canonical server state. The event contains no content or permission decision. A write-permission mismatch additionally blocks stale editor controls while refetching. No new background poller was added. The optional completion callback leaves existing non-marketing behavior unchanged.

## Actual collaboration evidence

- `evidence/collaboration-auth-retry.jsonl`: one deliberately injected transient authorization failure, followed by successful authorization approximately 1.7 seconds later without page refresh. The injection was confined to the disposable preview source and has been removed.
- `evidence/collaboration-recovery-persisted.json`: development-room read confirms saved comments from two distinct synthetic users. Browser replies appeared on the other user's page without refresh.
- Refreshing the employee page after the two-way edit retained all three updated paragraphs and showed synchronized status, confirming persistence rather than an optimistic local display.
- Existing two-administrator SQL/browser approval acceptance and local file upload/preview remain documented in `CONNECTED_ACCEPTANCE.md`.
- After the peer-status repair, administrator A returned version 4 for changes; the already-open employee page automatically restored editing and uploads. The employee then resubmitted version 5; the already-open administrator page automatically showed the fixed version and approval controls. Administrator A approved, and the employee automatically received **1/2**, still `in_review`. No manual page refresh occurred during these three transitions. Evidence: `evidence/peer-approval-progress.png`.

These are real Liveblocks connections with synthetic test identities. They do not establish that two distinct human Slack accounts have logged in and collaborated.

## Dedicated real login

The prior saved Clerk development instance returned `resource_not_found` and was absent from the application list. A new **Task Marketing Isolated Test** development application was created:

- app: `app_3L8qZznRq1INxJxWedBuT6o99lq`
- instance: `ins_3L8qZzogoyNkwbjNByNaQZDnu33`
- frontend: `great-horse-9598.clerk.accounts.dev`

The user manually completed backend-key creation and explicitly authorized storing it only in local isolated configuration. Private configuration and generated environment files are ignored by Git and mode 0600. The launcher verifies the exact app/instance, development environment and development key prefixes before starting.

With separate explicit authorization, the existing **Task Isolated Test** Slack app (`A0CA851V6C8`) credentials were saved into the new Clerk Slack connection. Its new callback was added alongside the previous test callback. No production app, scopes or bot permissions were changed. Client secrets are not included in source or this report.

The default shared Slack connection first produced `invalid_team_for_non_distributed_app`. After selecting the dedicated test credentials, the browser reached the correctly named **Task Isolated Test** consent page. The user manually accepted it and the callback established a real authenticated session. The root-page loading issue described above was then repaired and verified separately; a second fresh OAuth round trip after that repair was not performed.

Confirmed in the browser and a read-only query of the new test Clerk app:

- Tony's new test account uses `oauth_slack`, has the allowed workspace ID and a saved verification timestamp, and defaults to **employee**.
- Direct access to `/admin/settings` redirects to `/access-denied?reason=admin-only` with an employee explanation.
- The real account creates local content `c0c5a245-fd23-47c3-aa0e-765c0d2bf384` and connects to the designated Liveblocks development room.
- A second page with the same real account reads the saved body, then changes it and posts an ordinary comment. The first page receives both without refresh.
- Submitting creates fixed version 1 with approval progress **0/2**, no employee approval button, and both rendered body editors report `contenteditable=false`.
- Evidence screenshot: `evidence/real-slack-employee-review.png`.

Only one real Slack account was available. Same-account dual-page sync and distinct synthetic-user sync are separate evidence; neither proves two distinct real Slack accounts collaborating.

## Verification

- Targeted login/isolation tests: 8 passed; whole-project TypeScript and targeted lint passed in the same verification run.
- Native marketing preview/SQL/isolation tests: **13 passed**. The loopback-listen test requires local server permission; its restricted run failed with EPERM, and the permitted rerun passed.
- After the additional peer-status fix, targeted tests (permission synchronization, marketing review integration and original fixed-version editor) **9 passed**; whole-project TypeScript and targeted lint passed.
- Full application regression suite after the peer-status repair: **342 passed across 96 files**, two workers, no failed files.

## Still outside this acceptance

Real multi-person Slack accounts, cloud Supabase/PostgREST and cloud file transport, production deployment and complete Murmura page/animation parity remain separate work. This report does not claim production readiness or full-system completion.
