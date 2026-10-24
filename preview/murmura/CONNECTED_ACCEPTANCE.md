# Connected editing and review checkpoint — 2026-10-24

This records the initial checkpoint. See [RECOVERY_ACCEPTANCE.md](RECOVERY_ACCEPTANCE.md) for the subsequent authorization recovery, type-check repair and dedicated Clerk/Slack login work. In particular, the type error below has since been repaired, and a separate development Clerk app has been configured; the original checkpoint's login boundary is historical.

## Implemented in this checkpoint

New `/marketing`, `/marketing/content/new` and `/marketing/content/[contentId]` routes reuse Task's actual content, approval, upload, ordinary comment, fixed-version and Liveblocks components/services. They use the existing verified identity and server permission rules when run normally. The original static demo is a separate visual reference; its fake account switching and single-click demo publishing are not used for these operations.

The scoped shell uses original public brand/font assets and the original GSAP/Flip runtime extracted with source-hash verification. Its current React layout adapts Task's real editor and review controls. This checkpoint does **not** establish complete visual/state/animation parity for all eleven original demo modules.

## Isolation

`npm run preview:marketing` creates a private disposable source copy under `.isolated/marketing/web/<run>` and binds Next to `127.0.0.1:3218` only. That generated copy replaces authentication with three labeled test identities, database transport with a test-only PGlite adapter, and uploads with local files. It executes the existing twenty main SQL migrations, including the actual approval RPCs. No production environment file is copied or read.

The only connected cloud service is the previously designated Liveblocks **development** project `6a91c42f2636d77aa4a4f4eb`, validated against development key prefixes. Only new UUID content rooms from this run were written. No Slack messages, Clerk changes, production database migration, commit, push or deployment were performed. The old canceled n8n workflow is neither copied nor started; only the previously saved test-project credential record is read selectively.

The synthetic identity, local SQL adapter, test entry and local storage endpoints are generated in the disposable copy only. They are not normal application routes or authentication fallbacks.

## Browser evidence

Test identities: one employee plus two distinct administrators, using separate loopback-host cookie scopes.

1. Employee creates content through the existing create action, opens its new detail route and enters body text.
2. Employee posts an ordinary comment; administrator sees it. Administrator posts a reply; employee receives it without manually refreshing.
3. Employee uploads `marketing-upload-test.png` through the existing signed-upload/request/finish flow. The actual bytes are checked and saved locally. Image preview displays the image; separate download link remains available.
4. Submission creates fixed version 1. The editor becomes read-only, upload control disappears, and the submitted image remains in the fixed file list.
5. Administrator A approves: status stays `in_review`, progress 1/2, same administrator cannot approve again through the UI. Actual SQL test also rejects an employee approval and prevents a duplicate admin from satisfying both slots.
6. Administrator B approves: status becomes `approved`, progress 2/2 and separate approval history entries appear.
7. On the read-only synchronized body, an administrator selects specific text, opens the composer and saves an anchored comment. The employee sees it without page refresh.
8. Employee reply is confirmed persisted through a read of the development room, and another administrator reads that saved reply. Resolving the thread updates the employee's unresolved/resolved counts without refreshing.
9. Separate content is returned with a change request; employee regains body and upload controls, edits and resubmits. It becomes fixed version 2 with progress 0/2 and both historical events visible.
10. At 390×844, document width equals viewport width; editor text wraps and deep/light themes work. Screenshots are in `evidence/connected-*`.

## Failure observed and handling added

One optimistic reply did not persist while its room reauthorization returned 403. Fresh authorization and reconnection subsequently succeeded; the later reply was verified in the service and another user’s UI. The exact cause of that single transient authorization failure is **not confirmed**.

The new workspace now listens for Liveblocks save/connection errors. On failure it explicitly says the change is not confirmed saved, makes the collaborative controls inert, and offers reconnect. This error handling has regression tests. It does not claim to repair an unidentified upstream authorization failure. Initial room loading still uses the existing ContentRoom behavior.

## Validation and boundaries

- Full existing suite plus the new feature tests: **328 passed across 94 files**, using two workers to avoid simultaneous PGlite startup timeouts. The first unrestricted parallel run had six startup timeouts; it was rerun with bounded concurrency and passed.
- Native preview/SQL/mapping tests: **9 passed**, validating source hashes, loopback-only static preview access and the unchanged SQL workflow. The loopback server test requires normal local listen permission.
- Targeted lint covers the new routes, components, launcher and test adapter: passed without warnings. `git diff --check` also passed.
- Whole-project type checking still reports the pre-existing implicit `any` in `tests/features/admin/notification-settings-actions.test.ts:102`; no new marketing type error was reported. Therefore no claim of a clean production build is made.
- This is local workflow acceptance with synthetic identities, actual SQL and a real development collaboration project. It does **not** prove real Clerk/Slack login, hosted Supabase/PostgREST or cloud-storage transport, production behavior, Slack notifications, video/Office previews, or the rest of the Murmura feature set. Those remain separate acceptance work.
