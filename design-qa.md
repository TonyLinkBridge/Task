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


---
# 2026-10-26 最新检查：Settings 个人资料与外观

仅覆盖这两页及共用设置侧栏，不将此前全站检查当成本次正式验收。

## 视觉依据和尺寸

- 来源：https://demo.codeandchill.store/murmura/#/settings/profile 和 #/settings/appearance。
- 证据目录：preview/murmura/evidence/settings-profile-appearance-2026-10-26/。
- 桌面来源：01-reference-profile-top.png、02-reference-profile-bottom.png、03-reference-appearance.png、04-reference-appearance-dark.png；实现：19-implementation-profile-desktop-final.png、13-implementation-appearance-desktop-final.png。
- 手机来源：05-reference-appearance-mobile.png、18-reference-profile-mobile-verified.png；实现：20-implementation-profile-mobile-final.png、17-implementation-appearance-mobile-light.png；深色10-implementation-appearance-mobile-final.png。
- 桌面 CSS 与截图 1280×720，手机 CSS 与有效截图 390×844，DPR 1；无需密度缩放。不使用最初截到旧画面尺寸的06、15、16文件作为手机验收依据。
- 状态：实际测试管理员资料、浅色/深色/系统主题，真实角色权限；不复制演示人物、品牌和付费数字。

## 对照与检查

- 同一次图像输入对照了来源与实现的桌面资料和外观；手机资料亦对照来源/实现，检查了原版居中头像卡、纵向字段和横向菜单。
- 字体：沿用 Urbanist 和现有系统中文字体，标题24px、侧栏/字段字体和层级保持来源；中文换行与登录名称长度属于实际内容差异。
- 布局：290px侧栏、16px栅格间距、右侧26px内边距、112px头像、三张等宽主题预览。测试标示条和JUYU通用导航保留，不能把这部分的偏移算成设置卡片尺寸差异。
- 色彩：沿用来源 tokens、玻璃卡片、边框及深色模式。主题 mock 控件直接使用来源结构/样式，未重画替代素材。
- 图片：真实登录头像，无图片时显示姓名缩写并有明确空状态。此 fixture 无真实照片，照片/缩写持久化与恢复通过数据库检查。
- 内容：姓名/职务自改；邮箱保留验证入口并只读；角色/权限只读并来自网站管理；只有一个实际工作区，统计为成员/可审核成员/工作区，不复制付费演示。
- 交互：保存/刷新、连续字段修改依次使用返回版本号、失败/冲突提示、主题刷新保留、方向键/Home/End、侧栏主题联动、子页切换与手机横向分类可用。
- 浏览器控制曾在旧开发标签失去响应；新标签实际刷新正常，未据此宣称已定位旧标签根因。重新打开后检查控制台没有 error。

## 发现及修复历史

- P2：手机标题与统计挤在一排。固定统计占整行，并按来源缩短统计行高；20最终手机截图与宽度检查通过。
- P2：手机当前分类在横向屏幕外。只滚动分类容器，显示当前分类，避免把整页向下滚。
- P2：共享 card 规则覆盖 sticky，侧栏比内容低16px。提高设置侧栏规则优先级，最终实际矩形顶部一致，13截图通过。
- P2：没有照片时照片选项仍选中。数据库返回有效 initials 状态，浏览器确认照片禁用、姓名缩写选中。

## 已知边界与后续

- 这是已映射真实功能的本机验收，未操作正式站。现有 Clerk 账号编辑对模拟身份不开放；真实邮箱验证/头像更新通过原账号管理流程，不在资料表单另建身份流程。
- 动画使用现有 Motion/GSAP基础，右侧 .16s 退出/.42s 进入、.55s菜单位移、移动纵向与减少动态效果；不声称逐帧完全相同。
- 没有未处理的 P0/P1/P2 页面问题；P3：中文标签、真实资料和原有JUYU导航造成的文本/间距差异，已记录为有意产品对应。

final result: passed
