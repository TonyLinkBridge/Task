# Murmura experience integrated into Task

## Agreed direction

The user explicitly wants Murmura's whole observed experience—pages, controls, functionality, animations and navigation transitions—inside the existing Task product. This is one application with the existing data and identity, not a permanent second independent app. Existing ordinary tasks, help, BlockNote, inline/general comments, files and Slack notifications remain part of the result. Development and acceptance happen in an isolated copy; the production site and its data stay untouched.

The user repeatedly instructed proceeding directly, including after being told the URL-to-code skill's permission limitation; we follow that explicit execution instruction without interpreting it as author permission. Keep actual source attribution and distinguish local reference use from publishing/distribution. Do not fabricate source ownership or a license.

## Approach

Use the exact publicly browser-delivered frontend modules/styles/timelines as the visual reference checkpoint. Keep their assets local and retain notices/hash manifests. Separately adapt the canonical Task records and operations, then replace simulation services one action at a time. The local preview has no API or credential pathway to production.

Other approaches considered and rejected: two indefinitely independent products (duplicate editing/review and data); replacing production immediately (violates explicit isolation). A separately run preview is a temporary development tool, not the final architecture.

## Business constraints

- Real Clerk IDs and employee/admin roles remain authoritative; demo account switching never authorizes real access.
- Employee posts require two distinct admins; invalidated/previous-version/duplicate approvals do not count.
- Preserve submitted fixed versions, collaborative drafts, inline comments and author/assignee distinction.
- Preserve UTC instants with Malaysia display/input dates, including midnight boundaries.
- Due time does not auto-publish; publication recording and real platform delivery are different events.
- Preserve custom platforms, including Telegram; platform labels are not evidence of connected social accounts.
- Keep historical attachment references and existing deletion restrictions.
- No production env reads/copies, DB migrations, Slack sends, auth changes, pushes or deployments.
- n8n remains canceled and outside this branch; no agents.

## Acceptance tracks

1. Source parity: same viewport/state comparisons, exact assets/timelines, all routes and nested states. The current checkpoint covers major routes and selected interactions, not exhaustive acceptance.
2. Product behavior: canonical services handle permissions, versions, persistence, sync, history and failure recovery; demo data is never presented as real. This stage is not yet wired to the original UI.

## Current deliverables

- Local read-only preview at `/murmura/`, startup `npm run preview:murmura`.
- `features/marketing/task-adapter.mts`, tested against canonical Task shapes and approval/time edge cases.
- `preview/murmura/task-mapping.md` names existing services and remaining connection work.
- `preview/murmura/README.md`, source/media manifests, third-party notices and screenshot evidence.
- `design-qa.md` records a bounded visual-checkpoint result and actual outstanding work.

## Remaining work

Complete nested-state/source-interaction coverage; build actual integrated routes and replace original local simulation writes with existing server-validated actions; integrate tasks/help/BlockNote/comments; validate with independently configured test services; implement real platform inbox/metrics/listening/delivery where needed. Do not describe this checkpoint as the whole product finished.
