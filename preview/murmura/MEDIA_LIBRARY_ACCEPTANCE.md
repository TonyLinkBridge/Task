# 独立素材库本机验收 · 2026-10-25

范围：`codex/murmura-integration`，仅本机隔离版。没有修改正式数据库、账号配置、main、Vercel，也没有推送。

## 官方组件

选用 Arc File Upload，按官方手动安装流程接入。官方 TSX/CSS 字节保持一致，MIT LICENSE 保留；依赖 motion/lucide-react 已存在。

- 官方说明：https://uiarc.dev/components/blocks/file-upload/markdown
- 比较来源：https://uiarc.dev/components/file-dropzone/markdown
- Registry：https://uiarc.dev/r/file-upload.json
- source props/哈希/键盘/a11y 映射：`components/arc/README.md`
- 适配只在宿主层：原文件类型、100MB、真实 XHR 进度、AbortSignal、失败重试、2 并发队列、Task 浅深色变量。
- 保留 Enter/Space、描述绑定、状态播报、每行取消/重试标签、焦点恢复、减少动画设置。

## 功能与数据

- 文件库可独立上传、名称搜索、类型筛选、图片预览和下载。
- 所有已验证团队成员可上传及选用；员工只管理自己上传的素材，管理员管理全部。
- 从素材库移除是可恢复操作。原私有 bucket 不改公开；原文件下载逻辑保留。
- 草稿/需要修改状态可选用素材；审核状态拒绝附件变更。
- 复用时复制为每篇内容的独立附件。相同素材重复选用同一篇不会叠加附件。
- 原有内容附件汇总仍保留在「查看各篇内容现有的附件」。原内容直接上传也换成 Arc，预览下载保留。
- 原双管理员、指定文字留言、审核版本快照不变。
- 上传完成后保存失败可重试，不重复传输；保存/关联成功但回应丢失时，保留可能已提交的副本，重试查回已有附件。
- 明确数据库拒绝时清理未关联副本；回应状态不明时优先保留，避免破坏历史。没有增加后台孤立文件清理任务。
- 分批读取素材，避免数据库默认单次行数限制把旧素材隐藏。

## 浏览器实测

使用现有专用测试 Clerk 登录。数据库与文件均在本机一次性环境；没有访问正式 Supabase。

1. 真正上传 `task-media-acceptance.png`（640×360，4649 bytes）。
2. 预览成功；下载内容 SHA-256 和原文件相同：
   `69f903cac95f06d07cd0d8bbc8e4d7b75181b0861ac775dce5dde84cae012d29`。
3. 从真实建立内容表单创建两篇草稿，并在两篇各用同一素材。
   - A：`16d93bb1-ac3c-4a10-98a7-020b16a185fa`；独立附件 `f1536351-00a0-4b45-a03a-444e6b560aa2`。
   - B：`3e307d0a-3ab3-49c2-95dd-f1afbfcdba32`；独立附件 `6f8e0abf-661c-4d85-b85e-fe1f81a8cadd`。
4. 将素材从库里移除，再刷新两篇内容；两份独立附件仍能预览到 640×360。
5. 「已移除」能找到并恢复素材；搜索不匹配时显示空结果。
6. 原有内容附件汇总能看到 A/B 及各自预览下载。
7. 390、320 CSS 视窗与浅深色目视检查；修复手机搜索框被筛选框挤窄的问题。

## 自动检查

- Vitest 全量：118 files / 441 tests passed（最终本机源码）。
- Node 隔离流程：22 tests passed（包含本机 SQL、存储复制、双管理员、历史附件和访问隔离）。
- TypeScript `tsc --noEmit`：通过。
- ESLint 全项目：通过。
- `git diff --check`：通过。
- 测试环境提示：jsdom 的 scrollTo/navigation 未实现提示仍可见；浏览器检查没有依赖这些模拟行为。
- 桌面截图：`evidence/media-library-2026-10-25/library-desktop.png`。
- 320 宽手机预览截图：`evidence/media-library-2026-10-25/mobile-preview.png`。

## 验收边界

- 迁移 `supabase/migrations/20261025051526_media_asset_library.sql` 仅在本机 PGlite 执行；未在云端执行。
- Supabase 实际云存储/CORS、正式数据库迁移、多人真实浏览器同时操作未在本次验收范围；上线前需另行验证。
- 两名真人协同仍按此前用户要求跳过。原双管理员批准和历史附件逻辑由本机 SQL 回归覆盖。
- 文件类型和大小来自实际 Storage.info；没有声称做文件内容安全扫描。
- 上传队列中 × 的含义是取消传输/移除行，已存素材使用卡片上的可恢复移除按钮。
- 测试站使用一次性本机数据；重建预览会清空这批验收样本。迁移文件保存在源码中。
