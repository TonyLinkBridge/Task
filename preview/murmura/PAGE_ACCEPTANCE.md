# Page mapping acceptance — 2026-10-24

This is isolated Task behavior acceptance, **not** complete Murmura 1:1 or release acceptance. See `task-mapping.md` for every connected route and unsupported external capability.

## Verified

- Calendar week/month/list, month has 42 cells, Malaysia midnight/week boundaries in tests, content links, custom-platform and status filters. Browser showed the actual Clerk-login test content; selecting published hid an in-review record.
- Overview counts come from current scheduled-content records. Approvals has a separate route and actual in-review cards. The old query-string entry redirects to it.
- Global search found the actual test content and linked publication task; content results route into the new workspace. Search dialog closes and account menu exposes the original sign-out operation. Sign-out itself was not executed in this pass.
- Library showed the previously uploaded test file. Image preview loaded at **640×360**; the separate download produced `/Users/tony/Downloads/file.png`. SHA-256 matched the original fixture: `aac1b133cbb8bd384239e46c400d7c627e6199fdead48f3c07566a0bd800dadd`.
- Synthetic administrator A created **隔离平台验收**, disabled it and restored it, all through the original platform actions and local SQL. Employee/admin page-boundary tests confirm employees never receive the editor or archived-platform query. Team page showed the employee and two administrator profiles, with no role-changing controls.
- Settings profile/notifications/workspace/approvals/security/billing were read in the synthetic preview. The real test account's appearance page toggled light→dark→light. Data export contained exactly `generatedAt`, `timezone`, `counts`, `contents`; `Asia/Kuala_Lumpur`, one current content and matching total, no credential fields. The export link payload was inspected; no second download event was requested.
- The real employee created **新版页面验收｜普通任务** (`42edeb23-455d-4be6-9ee1-83e27c9ff564`). It appeared on the original task board. Existing linked publication task remained non-draggable. The ordinary task's keyboard-drag attempt dropped over the existing todo card; this does not prove a cross-column drag in the new wrapper. Existing board/action regression tests remain green.
- The assigned-task notification appeared in Inbox. After authenticated PATCH succeeded, Inbox unread and header bell both changed 1→0 without refresh. New tests retain unread state on API failure. The browser evidence is `evidence/connected-inbox-read-state.png`.
- Analytics rendered real content-status/platform totals. Listening explicitly states external monitoring is unavailable. No social metric, conversation, account connection, billing or security switch is presented as live.
- Content detail now retains its canonical author/admin delete button. Its default destination stays `/content`; marketing passes `/marketing`. A regression test failed on the old return path and passes after the change. No irreversible content delete was performed in the browser.

## Verification and limitations

- Full Vitest run: **355 passed / 101 files**, single worker, 20-second test/hook limit. The earlier two-worker run had local database startup/resource timeouts and an intentionally newly introduced read-state regression; it was stopped. The repaired suite passed.
- After the final delete-return addition: **28 targeted tests passed**, including all marketing feature tests and delete-button tests; whole-project TypeScript passed. This is separate from the earlier full run.
- Relevant lint passed. Native SQL/query/source tests: **15 passed**, validating bound search parameters, source hashes, loopback restrictions and both generated runtime modes.
- No production build/deployment or hosted Supabase acceptance was performed. All SQL and file writes were local; development Liveblocks was the only collaboration target. No Slack message was sent.
- Source self-review found no new permission bypass; author self-review is weaker than an independent review. No agents were used, per the user's instruction.
- The browser suffered repeated CDP/navigation timeouts while multiple development servers/tests were active. After stopping old reference and synthetic previews, the real test account's appearance, data export, analytics, listening, approvals and content-delete entry were additionally read successfully. Real preview remains at `http://127.0.0.1:3219/marketing`. Final desktop evidence: `evidence/connected-pages-overview.png`.
- Mobile override was attempted but DOM viewports remained desktop-sized, even on a new tab. Override was reset. **No mobile acceptance or exact transition-animation pass is claimed.**
- Existing help remains linked to its original GitBook UI; a new help walkthrough, all original nested controls, cross-column drag in the new wrapper, timed publication, connected Slack settings saving and full 1:1 route/drawer/hover animation remain unverified in this pass.
- Two actual humans collaborating through Slack identities: skipped at the user's request, not passed.

## 2026-10-25 continuation: visual, animation and mobile

The earlier mobile/transition gap has now been addressed for the connected Task mapping. Read `VISUAL_FINISH.md`: 13 pages × 3 actual widths, source/local combined screenshots, original entry/indicator/Flip timing, route/modal checks, 50 targeted tests and 15 native isolation checks. Full original pixel/control parity and physical mobile testing are separate boundaries. External capabilities and two-real-human collaboration remain skipped. No production change, commit, push or deployment.
