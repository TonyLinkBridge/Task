# Team Permissions Implementation Plan

> 单人直接执行；用户明确不要助手。使用 executing-plans 按项实现，不发布。

**Goal:** 按已观察的原版补齐团队体验，把真实权限接入现有系统。
**Architecture:** 独立团队角色/邀请/审计表，profiles 保存角色与状态；事务 RPC 验证权限和版本，服务端逐请求载入有效权限；React 页面复用来源布局及现有 Arc Select、Toast、Dialog。
**Tech Stack:** Next.js、Clerk、Supabase Postgres、PGlite、React、Vitest。
**Spec:** docs/superpowers/specs/2026-10-25-team-permissions-design.md

## Global Constraints
- 只在当前隔离工作树和本机数据库操作；不改正式权限、不推送部署。
- 保留 Slack 身份验证、旧数据、审核版本与不同审核人数限制。
- 不将没有的外部服务或演示状态标成已接入。

## Review Focus
- 现有 Clerk 元数据不能在重新登录时还原旧权限。
- 用户修改输入、旧会话、直接请求 RPC 都不能绕过权限。
- 并发改权限不能移除最后管理者或让旧版本覆盖新设置。
- 未验证邮箱或其他 Slack 工作区不能接受邀请。
- 权限撤销后协同/后台动作不能仍可写。

### Task 1: 数据库与权限模型
- [x] 在 tests/features/team/ 中先写角色默认、事务、越权、引用与冲突检查并观察失败。
- [x] 实现 features/team/permissions.ts、types.ts 及 CLI 创建的 team_permissions 迁移。
- [x] 本机 PGlite 实际执行并验证。

### Task 2: 接回真实服务端权限
- [x] 实现 features/team/repository.ts、service.ts、actions.ts、身份载入；旧权限保持兼容。
- [x] 将内容、审核、任务、素材、设置及协同动作接到有效权限。
- [x] 验证拒绝在实际操作前发生，权限撤销/成员停用生效。

### Task 3: 成员与角色页面
- [x] 按截图实现汇总、分区、表格、搜索、角色过滤、详情抽屉和菜单。
- [x] 实现角色卡片、权限矩阵、复制新增角色及版本冲突恢复。
- [x] 浏览器按相同尺寸对照来源并修正。

### Task 4: 邀请与审计
- [x] 实现邀请保存/重发/撤销与邮箱核验；本机只用测试发送适配器。
- [x] 接操作时间线、人员/类别筛选、分类及活跃度汇总、CSV 输出。
- [x] 验证邀请绑定、失败状态及权限预览。

### Task 5: 验收与保存
- [x] 运行完整检查、类型、lint、构建；手机/键盘、跨操作回归及截图。
- [x] 保存本机分支，列清 SQL 和上线前仍需的真实环境验收，不自动发布。


## 本机验收结果

- 2026-10-26：143 个测试文件、504 项检查全部通过；完整生产构建成功；TypeScript、ESLint、git diff --check 通过。
- 浏览器实际验证：角色权限取消/恢复并刷新保留；新增自定义角色、分配给测试员工并刷新保留；无撰写权限时 Compose 拒绝建立内容；邀请创建/重发/撤销；成员停用后拒绝进入、恢复后可重新进入；操作记录与搜索；390px 手机成员页/抽屉无横向溢出；Esc 关闭资料后焦点回到成员按钮。
- 测试员工已恢复为编辑；保留示例自定义角色及审计记录。未自动指定负责人。
- 截图：preview/murmura/evidence/team-implementation-2026-10-25/。浏览器本机入口 http://localhost:3223/marketing/team。

## 有意对应与未验收范围

- 本系统只有一个内部工作区，未加入演示站虚构的品牌/付费席位和平台数据；角色权限对应当前真实业务。
- 同事视角为只读权限预览，不冒充同事登录。Clerk 安全状态没有资料时显示未记录，不代表 Slack MFA。
- 本机邮件使用模拟发送，未验证真实邮件收件；未在正式环境进行两名真实用户同时在线撤权验收。
- 现有业务服务/数据库权限及 Liveblocks 私有房间授权已接入新权限；真实外部 Liveblocks 撤权传播仍待隔离真实账号联测。
- 本机停用测试已验证转向 access-denied；测试站入口限制会显示 Outside isolated test scope，正式拒绝页未在本次模拟身份浏览器中验收。
- 生产上线前必须执行 supabase/migrations/20261025144445_team_permissions.sql，并确认负责人、角色规则及外部测试。此次没有执行正式 SQL、修改正式账户、推送或部署。
