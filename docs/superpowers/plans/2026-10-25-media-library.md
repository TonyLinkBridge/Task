# Media Library Implementation Plan

Goal: 独立素材上传、管理和跨内容选用，使用官方Arc File Upload。
Architecture: 原私有存储＋素材元数据；复用时复制为原内容附件，继续走原审核快照。新服务验证权限及真实文件。
Tech Stack: Next/React、Arc/motion、Supabase服务、隔离PGlite。
Spec: docs/superpowers/specs/2026-10-25-media-library.md

约束：无助手、无正式系统操作、无推送部署；保留前几轮未提交改动。每阶段先写失败测试，再实现并验证。

- [x] 素材数据/权限/复用：features/media-library/{types,repository,service,actions}.ts、CLI生成的迁移；原授权、软移除、重复选用、送审锁定、历史保留测试。
- [x] Arc真实上传：官方components/arc/file-upload、files/upload-signed-file.ts；进度、取消、重试、最多2并发、原内容附件上传保持可用。
- [x] 页面连接：新版Library独立素材与内容附件入口、内容素材选择器、预览下载接口；隔离存储copy和增量迁移。
- [x] 本机真实文件上传→两篇选用→移除素材不影响附件/快照、手机键盘/错误检查，完整回归、类型和规范；输出验收边界。

验收证据：preview/murmura/MEDIA_LIBRARY_ACCEPTANCE.md。本机检查通过；未推送、未部署、未操作正式数据库。
