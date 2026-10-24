# Murmura isolated frontend checkpoint QA

**Scope:** local frontend/reference checkpoint only. Real Task service integration and exhaustive acceptance of all original sub-states remain unfinished. A passed result here does not mean the complete user request is finished.

## Source and implementation

- Source: https://demo.codeandchill.store/murmura/
- Implementation: http://127.0.0.1:3217/murmura/
- Source visual truth: `preview/murmura/evidence/source-overview-desktop.jpg`, `source-overview-mobile.jpg`, `source-drawer-desktop.jpg`.
- Rendered implementation: matching `local-*` files in the same directory.
- Desktop CSS viewport and both screenshot pixel sizes: 1440×1000.
- Mobile CSS viewport and both screenshot pixel sizes: 390×844, explicit clips; no density resampling needed.
- State: original demo owner, overview, light theme; mobile also tested dark; contents are separate demo histories with small generated metric/countdown differences. No production account state was compared.

## Combined comparisons

- Full desktop: `evidence/compare-overview.jpg` (source left, local right).
- Full mobile after marker fix: `evidence/compare-overview-mobile.jpg` (source left, local right).
- Details drawer: `evidence/compare-drawer-desktop.jpg`.
- Focused font/header comparison: `evidence/compare-typography.jpg`, source above and local below.
- Dark mode final screenshots were captured on both origins. A previous mobile comparison from an old browser tab had misregistered fixed controls and was rejected; a fresh source tab with matching DOM viewport/control geometry supplied the accepted mobile light comparison.

## Required fidelity surfaces

1. Fonts/typography: Urbanist supplied by the original linked CSS is localized; focused comparison shows the same weights, title wrapping, labels and compact navigation rhythm.
2. Spacing/layout: source CSS unchanged; desktop hero/two-column cards and mobile single-column/bottom navigation align in the combined comparisons.
3. Colors/tokens: source tokens/mesh gradients/radii preserved; light and dark styles use the same original stylesheets.
4. Images/icons: exact source photos, avatars and source icons retained, no drawn replacements; images and fonts load from local paths. 78 media/font files checked against byte counts.
5. Copy/content: original UI copy retained; original demo and local demo histories differ after local draft tests. Safety indicator is an intentional local-only addition; Task copy/Telegram/roles await integration rather than being represented as source parity.

## Findings and comparison history

- [P2, fixed] Preview indicator overlapped mobile navigation labels. Initial placement at bottom left was changed to a small non-interactive top strip on widths ≤760px. Post-fix evidence: `local-overview-mobile.jpg`, `compare-overview-mobile.jpg`; Home/Calendar/Create/Inbox/More labels remain readable.
- [P3/source behavior] Original JS emits `GSAP target not found` warnings when optional elements are absent. The same warning was captured on the official demo and local copy. No browser console errors were observed during the local route/draft/theme checks. Original modules are preserved unchanged; warning cleanup is separate from this fidelity checkpoint.
- [Expected] Preview status marker, local saved draft, generated metrics and countdown differences are documented intentional/environmental differences.

## Actual browser interactions tested

- All eleven primary routes loaded without a page-load error.
- Eight Settings subroutes opened.
- Multiline draft saved, persisted after refresh, and appeared in global search results.
- Calendar Week/Month/List changed pressed state and content.
- Content detail drawer opened, showed preview/history, and closed.
- Mobile More menu exposed secondary pages; Light/Dark worked and survived reload.
- Source and implementation loading, title/card/counter entry, mesh, navigation pill and drawer transitions use the exact original public JS resources; exhaustive timing/hover/rapid-interruption review remains pending.

## Code verification

- Native tests: 8 passed (server isolation/path access, resource integrity, canonical Task mapping).
- Existing suite: 320 passed / 91 files.
- Targeted lint: passed.
- Whole-project TypeScript check: baseline failure remains in unchanged `tests/features/admin/notification-settings-actions.test.ts:102`, implicit `any` on `input`; not caused by the new mapping module. No overall typecheck-pass claim.
- Source original JS/CSS hashes unchanged, notices and manifests retained.
- No production env, DB, login configuration, Slack sender, push or deployment used.

## Remaining acceptance

- Complete nested-state/keyboard/upload/permission and interrupted-animation review across all pages.
- Wire Task projection and server actions to the new UI; keep canonical two-admin approvals and submitted snapshots.
- Integrate tasks/help/BlockNote/comments; external platforms require their own real service work.

**final result: passed**

Result applies only to the explicitly bounded visual/reference checkpoint above, not exhaustive 1:1 acceptance or connected-product readiness.

## 2026-10-25 — connected Task visual/motion/responsive checkpoint

This checkpoint supersedes the earlier statement that mobile could not be measured, **within the connected Task mapping scope only**. See `preview/murmura/VISUAL_FINISH.md` for the precise evidence and boundaries.

- Source and connected screenshots were combined at matching 1440×1000 and 390×844 sizes, then inspected. Source tokens/fonts, header/dock rhythm, translucent cards, overview hierarchy and stacked phone hero were ported. The comparison exposed a phone media overflow and an incorrectly horizontal phone hero; both were repaired and recaptured.
- New source-derived calendar includes hour rows with shared subgrid sizing, a mini month, genuine draft links, filtering and week/month/list modes. Extra posts in an hour do not overlap other columns' hour labels. The calendar retains local horizontal scrolling on narrow screens.
- Original entry/indicator timing and GSAP Flip are reused. Route exit, pending navigation, reduced-motion fallback, failed optional motion, rapid clicks, browser back/forward and modal focus return were checked with the applicable browser/unit evidence.
- All 13 connected page types had actual 320/390/768 layout readings without page-wide overflow. File preview loaded 640×360 pixels at phone width. Light/dark appearance and mobile More were exercised.
- No P0/P1/P2 issue remains **from this bounded pass**. Different business content is deliberate: current internal notifications, approvals and tasks replace demo social data. This is not exhaustive pixel parity across every original nested control or a claim of a bug-free product.

**Checkpoint result: passed for the mapped UI and tested browser sizes.** Physical mobile acceptance, full original pixel/control parity, external integrations and production promotion are not implied.

## 2026-10-25 mapped-page consistency audit

See `preview/murmura/POLISH_AUDIT.md` for current-run evidence, accepted/rejected screenshots, fixes and explicit scope limits. Final related component/API tests 61/61, isolation checks17/17, typecheck/lint/diff checks passed. This pass is local only and does not supersede unverified whole-source parity, physical-device or two-person acceptance.
