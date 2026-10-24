# Murmura / Task isolated preview

## Current checkpoint (page mapping)

The connected isolated app is at `http://127.0.0.1:3219/marketing` (`node scripts/marketing-connected-preview.mjs --real-login`). Existing Task capabilities now back the overview, content editor, calendar, approvals, file library, custom platforms, members, tasks, notifications and relevant settings. See [PAGE_ACCEPTANCE.md](PAGE_ACCEPTANCE.md) and [task-mapping.md](task-mapping.md) for concrete evidence and gaps; [RECOVERY_ACCEPTANCE.md](RECOVERY_ACCEPTANCE.md) records dedicated test login and collaboration repair.

Two real humans testing together is skipped at the user's request. External social data/inbox/listening/automatic delivery and full original nested-layout/transition parity are unfinished. Production is unchanged. This work is being published only on the isolated `codex/murmura-integration` branch, without merging or deploying the production site. Browser evidence stays local and is excluded from Git. Old 3217/3218 reference/test-identity preview processes were stopped after acceptance to reduce resource use; source files remain available to restart them.

Everything below is the earlier static-reference checkpoint, not the current connected status.

Run `npm run preview:murmura`, then open `http://127.0.0.1:3217/murmura/`.

This checkpoint preserves the publicly delivered Murmura frontend modules and their actual animation timelines. It is a local reference preview inside an isolated Task worktree, not a connected replacement for the live Task site. The preview has no API proxy or production credentials and serves files only from `preview/murmura/site`.

## Verified at this checkpoint

- Eleven primary pages loaded in the in-app browser: Overview, Compose, Calendar, Inbox, Approvals, Analytics, Listening, Library, Channels, Team and Settings.
- Eight Settings subpages opened: Profile, Notifications, Workspace, Approvals, Security, Billing, Appearance, Data.
- Compose: multiline draft saved; persisted after refresh; global search finds the draft.
- Calendar: Week → Month → List selection changes.
- Post details: drawer opens and closes; network preview/history visible.
- Mobile More navigation, light/dark switching and theme persistence after reload.
- Desktop 1440×1000 and mobile 390×844 source/preview comparisons, including a focused typography crop.
- Every original JS/CSS resource matches its recorded SHA-256 hash. Photos and fonts are local.
- Eight native preview/adapter tests passed; unchanged application suite: 320 tests / 91 files passed.
- Targeted lint passed. Whole-project type checking still reports the pre-existing implicit-any error at `tests/features/admin/notification-settings-actions.test.ts:102`; this file is unchanged from main.

## Actual integration status

`features/marketing/task-adapter.mts` supplies a tested read-only projection of existing Task records. It preserves IDs, author vs assignee, current version, invalidated approvals, two-distinct-admin progress, custom platform IDs, Malaysia dates and stored/effective status. It does not grant permissions or publish anything.

**This adapter is not yet wired to the original demo UI.** Existing Task queries, server actions, BlockNote/Liveblocks and files remain to be connected in an isolated application environment. No production schema, login or environment file was changed.

Do not connect demo role-switching, fake security/billing controls or one-click simulation publishing directly to live Task data. See `task-mapping.md` for the individual destinations and remaining work.

## Evidence and limits

Evidence is kept in `evidence/`; the checkpoint comparison report is at project root `design-qa.md`. Source animation warnings (`GSAP target not found`) were observed on both the original demo and local copy. They are recorded, not treated as new regressions or silently hidden.

Not every nested page, permission combination, dialog, upload format, chart state or rapid-animation sequence has been manually accepted. This checkpoint is not a claim of complete 1:1 acceptance or real platform integration. The original demo's analytics, listening, publication, security and billing are simulations.

No push, deployment, production access, new login application or agents were used.
