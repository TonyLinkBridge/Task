# 2026-10-26 Arc 通知中心发布

用户确认本机效果后，明确要求合并 main 并正式上线。本次使用正常 Vercel Git 部署。

## 发布范围

- 官方 Arc Notification Center / Avatar / ArcProvider 源码及 MIT 声明。
- 保留现有任务与内容通知数据，新增已读／未读、个人收起、批量已读／清空、真实目标跳转。
- 个人收起只设置 dismissed_at，收件箱仍保留记录；请求按真实登录成员限制，一次最多 30 条。
- 加载失败可重试，保存失败恢复原状；避免重复提交和键盘焦点丢失；保持原版动画和减少动画分支，修正窄屏与矮屏溢出。

## 数据库前置升级

正式项目 LinkBridge / Task：opjhumwfvasvgzmsiyhu。
通过已登录 Supabase SQL Editor 将 supabase/migrations/20261025215221_notification_center_dismissal.sql 放在事务中执行，设置 5 秒锁超时。
结果：field_ready=true、index_ready=true、rls_enabled=true；通知记录仍存在。未删除通知、修改已有内容或发送 Slack 消息。

## 发布前验证

- 本机优化构建成功，TypeScript 和改动文件 lint 通过；发布时逐文件核对实际代码与成功构建副本一致。
- 发布前重新运行通知、收件箱及通知数据库相关检查：12 个文件、46 项全部通过。
- 本机浏览器验证真实接口保存、移除后收件箱保留、键盘／焦点、深浅色、390x844 与 320x568、小屏内部滚动和真实目标跳转。
- 详细本机记录：preview/murmura/ARC_NOTIFICATION_CENTER_ACCEPTANCE.md。

## 正式验收边界

部署成功需以 Vercel 的真实 Production / Ready 和 main 提交对应为准，不能仅凭 Git 推送判断。
正式页面及 SQL 结果截图保存在 preview/murmura/evidence/production-notification-center-2026-10-26/。
