# 补齐站内确认框

用户指出删除内容时仍出现浏览器原生确认框。重新读取 Arc Toast 与 Toast Stack 官方 Markdown，确认全站结果使用 Stack 符合官方建议；截图来自 DeleteContentButton 的 window.confirm，并非 Toast 渲染失败。

修复范围：删除内容、删除普通任务、清空已解决留言、重新修改已批准内容这四处原生确认，统一复用现有 Base UI Dialog 封装。确认与操作结果各司其职，不使用非阻塞 Toast 代替删除前的决定。保留原服务端动作、权限、Slack 清理、导航、中文危险说明和 Arc 官方 Toast 源码。操作请求异常时恢复按钮，报错后允许重试。

无障碍：alertdialog 的标题和描述关联；先聚焦取消；Escape 取消并返回触发按钮；请求执行中禁用按钮并阻止重复提交/关闭。桌面沿用系统弹窗，手机沿用已有底部布局。

本机验收：
- 修改前四组测试失败，能复现旧逻辑绕过站内确认。
- 修改后 138 个测试文件、486 个检查通过；类型检查、变更文件 lint、构建通过。
- 浏览器验证确认框、Escape 取消、Arc Stack Alt+T 聚焦、Escape 关闭和焦点返回；390×844 无横向溢出。
- 重新下载官方 toast.json，Toast TSX/CSS SHA-256 与现有文件完全一致。Stack 保持之前的中文标签适配。
- 演示只在 http://127.0.0.1:3222/marketing-test/feedback 使用真实 UI 组件及本机回调，不执行资料删除或发送 Slack 通知。截图位于 preview/murmura/evidence/feedback-confirmation-2026-10-25/。
- 尚未推送或部署；未执行正式站删除回归。

来源：https://uiarc.dev/components/toast/markdown 、https://uiarc.dev/components/toast-stack/markdown 。
