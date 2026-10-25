# Arc Notification Center: local acceptance

Date: 2026-10-26. This records the local acceptance completed before release. Subsequent production SQL, main publication and live verification are tracked in docs/releases/2026-10-26-arc-notification-center.md.
Reference: https://uiarc.dev/components/blocks/notification-center/markdown
Local integrated page: http://localhost:3223/marketing/inbox

## Source integration

- Official notification-center TSX/CSS, official Avatar/ArcProvider, shared motion tokens, and MIT notice retained. Source hashes and the exact host extension surface are in components/arc/README.md.
- Manual official dependency installation; existing motion/lucide reused and Radix Popover pinned to the existing transitive version 1.1.23.
- The original uncontrolled props still work. Task uses controlled state, one-request bulk callbacks, a real destination Link, Chinese labels, portal-safe theme tokens, loading/error/retry and network rollback.
- Original bell/count/view/row animations and reduced-motion branches retained. Outgoing rows now inert and hidden from assistive technology. Mutations use aria-disabled plus a click guard so the focused control does not blur during a request.

## Integrated browser checks (fixture accounts and local PGlite only)

- Opens from the real header, shows the actual notification endpoint results, expands body and exposes original task/content destination links.
- Single read and unread persist through a subsequent fresh page, and update Inbox without refreshing it.
- Dismissal persists on a fresh GET/open while the original notification remains in Inbox. Focus moves to the next notification.
- Enter opens the bell. Space toggles a row in automated tests. Tab navigation and Escape/close restore focus; exit animation completes before focus returns.
- Light/dark theme checked. At 390x844, the panel stays within the viewport. At 320x568, expanded details originally clipped the footer; corrected using Radix available height and internal list scrolling. Retest: panel bottom 556px within 568px; list overflow auto.
- The actual “打开详情” link opened the existing Publishing calendar and closed the panel. The development server compiled that route on its first visit; this is not a production navigation timing result.
- Saving does not blur the active read button, and repeated Enter cannot submit another mutation while a save is pending.
- No production user, Slack notification, credential, or formal database was altered.

## Automated verification

Notification/inbox/notification SQL suite: 46 tests passed across 12 files. TypeScript, changed-file ESLint, and the optimized Next.js build using dedicated test credentials passed. The first build rejected an optional Request route parameter; the exported PATCH wrapper was corrected to require Request, and the subsequent build succeeded. A full run passed 533 of 534 tests; its only failure was the old Inbox test expecting the previous bell label. That label assertion was updated and its complete suite passed in the 46-test rerun. No full-suite rerun was needed for that assertion-only change. Tests exercise real repository operations against isolated PostgreSQL, recipient scoping including mixed own/other IDs, private RLS retained, history preserved, bulk request bounds/validation, auth failure, save failure, controlled rollback, keyboard/focus, and notification/inbox synchronization.

## Remaining release boundary

- Apply the one additive SQL migration before releasing this code. It adds a nullable dismissed_at column and partial index, with no deletion or new public access grant.
- Real production notifications and devices have not been accepted in this turn.
- Reduced-motion behavior follows the official preserved implementation; do not represent a source check as a manual operating-system setting test.
