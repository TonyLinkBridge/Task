# 文件库与设置：代码合并，暂不上线

用户授权：把文件库管理和设置完善合并到 main，推送 GitHub，提供 SQL；暂不正式上线。

## SQL

执行 `docs/releases/2026-10-25-library-settings.sql` 整份一次即可。它与 `supabase/migrations/20261025092425_library_settings_management.sql` 内容一致，外加事务及中文说明，不需要两个文件各跑一次。

适用：已有当前 Task 素材库的数据结构。只增加文件标签、个人收藏、文案模板/Hashtag 集/快捷回复、使用次数与工作区偏好；不删除现有内容、附件、文件或历史版本。

本次不会连接正式数据库或执行 SQL。SQL 执行成功后，仍需另行授权正式发布。

## 发布保护

合并提交消息包含 `[skip vercel]`，由现有 `vercel.json` 的 `ignoreCommand` 和 `scripts/vercel-ignore-build.mjs` 跳过自动构建。

验证代码与 SQL 后推送 main；检查 GitHub/Vercel 状态确认该提交被跳过。不要手动点击 Redeploy，也不要添加无跳过标记的发布提交，直到数据库准备完毕且用户授权上线。

## 范围

保留员工双管理员审核、既有 Clerk/Slack 登录权限、马来西亚时区、素材独立副本与历史版本。不包含新的收费功能。无正式环境 SQL、权限修改或测试消息。

## 正式发布授权

用户已确认 SQL 执行成功，并于本次要求正式上线及验收文件库和设置。将以正常发布提交触发部署，保持数据库、登录权限和审批规则不变。真实站点验收结果另行记录。
