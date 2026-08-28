# 内部任务与内容排期工具：开发路线

**设计规格：** `docs/superpowers/specs/2026-08-28-internal-task-content-scheduling-design.md`

这项工作分成五个连续阶段。每个阶段完成后都必须通过自己的测试和人工检查，才进入下一阶段。

1. `2026-08-28-01-foundation-auth.md`：建立 Base UI 项目、Supabase 基础和 Clerk + Slack Workspace 登录。
2. `2026-08-28-02-task-kanban.md`：把示范任务换成真实任务、留言和可拖动 Kanban。
3. `2026-08-28-03-content-editor-comments-files.md`：建立内容、BlockNote、Liveblocks 指定文字留言和私人文件。
4. `2026-08-28-04-approval-scheduling.md`：加入两位上司批准、管理员快速批准、发布任务和三种排期视图。
5. `2026-08-28-05-slack-admin-audit.md`：加入 Slack 通知、定时提醒、管理员设置和完整历史记录。

每一阶段都沿用以下规则：

- 网站统一显示马来西亚时间 `Asia/Kuala_Lumpur`。
- Clerk 是唯一账号来源，不启用 Supabase Auth。
- 浏览器不能取得 Supabase 管理员密钥、Slack Bot Token 或 Liveblocks Secret Key。
- 任何管理员动作都要在后台重新检查 `role === "admin"`。
- 一般删除采用“收起来”，不永久删除历史、批准或发布记录。
- 每个功能先写会失败的测试，再写最少代码让它通过。

