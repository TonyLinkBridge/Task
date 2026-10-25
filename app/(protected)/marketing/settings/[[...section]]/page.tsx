import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarketingShell } from '@/features/marketing/components/shell';
import {ThemeOptions} from '@/features/workspace-settings/components/theme-options';
import {WorkspaceForm} from '@/features/workspace-settings/components/workspace-form';
import {AccountManagement} from '@/features/workspace-settings/components/account-management';
import {workspaceRepository} from '@/features/workspace-settings/repository';
import '@/features/library-management/components/management.css';
import { UserAccountMenu } from '@/components/auth/user-account-menu';
import { SlackSettingsForm } from '@/features/admin/components/slack-settings-form';
import { adminRepository } from '@/features/admin/repository';
import { saveNotificationSettings } from '@/features/admin/actions/notification-settings';
import { getVerifiedUser } from '@/lib/auth/get-verified-user';
import { getServerEnv } from '@/lib/env/server';
import { makeSlackClient } from '@/lib/slack/client';
const sections = { profile: '个人资料', notifications: '通知', workspace: '工作区', approvals: '审核规则', security: '账号安全', billing: '收费', appearance: '外观', data: '资料导出' };
export default async function MarketingSettingsPage({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section: parts } = await params;
  const section = parts?.[0] ?? 'profile';
  if ((parts?.length ?? 0) > 1 || !Object.hasOwn(sections,section)) notFound();
  const currentUser = await getVerifiedUser();
  let body: React.ReactNode;
  switch(section) {
    case 'notifications': {
      if(currentUser.role !== 'admin') { body=<><h2>你的通知</h2><p>通知会进入站内收件箱；频道和提醒规则由管理员设置。</p><Link href="/marketing/inbox">打开站内通知 →</Link></>; break; }
      const settings=await adminRepository.getNotificationSettings();
      const token=getServerEnv().SLACK_BOT_TOKEN;
      let channelLoadFailed = false;
      const channels=token?await makeSlackClient({token}).listAllowedChannels().catch(()=>{channelLoadFailed=true;return [];}):[];
      body=token?<>{channelLoadFailed?<p role="alert">频道列表暂时读取失败。已保存频道：{settings.slackChannelName??'尚未设置'}。请稍后刷新；原有通知设置不会改变。</p>:null}<SlackSettingsForm configured channels={channels} initialSettings={settings} saveSettingsAction={saveNotificationSettings}/></>:<><h2>频道提醒设置</h2><p>当前频道：{settings.slackChannelName??'尚未设置'}</p><p>提前提醒：{settings.reminderMinutes} 分钟</p><p>这个环境没有连接 Slack Bot，不会向任何频道发送通知。站内通知仍可查看。</p><Link href="/marketing/inbox">查看站内通知 →</Link></>;break;
    }
    case 'workspace': body=<WorkspaceForm initial={await workspaceRepository.load()} admin={currentUser.role==='admin'}/>;break;
    case 'approvals': { const administrators=(await adminRepository.listMembers()).filter(member=>member.role==='admin');body=<><h2>当前审核规则</h2><h3>当前管理员</h3>{administrators.length?<ul>{administrators.map(member=><li key={member.id}>{member.name}</li>)}</ul>:<p role="alert">目前没有可审核的管理员，请先由负责人检查成员权限。</p>}<p>员工提交的内容，需要两位不同管理员批准。改动后重新提交，会开始新的审核版本，旧批准不计入新版本。</p><p>管理员可以自己通过，或交给另一位管理员检查。审核决定和修改记录都会保留。</p><Link href="/marketing/approvals">打开审核列表 →</Link></>;break;}
    case 'security': body=<><h2>账号安全与登录设备</h2><p>登录和安全设置由 Clerk 管理，员工/管理员权限仍由管理员配置。</p><AccountManagement security/></>;break;
    case 'billing': body=<><h2>没有收费或订阅功能</h2><p>这是团队内部工作台，目前没有收费套餐、信用卡或发票功能。</p></>;break;
    case 'appearance': body=<ThemeOptions/>;break;
    case 'data': body=<><h2>导出团队资料</h2><p>内容排期导出只包含你当前可见的排期资料。JSON 保留结构，CSV 适合表格查看。</p><div className="workspace-export-links"><a className="marketing-primary" href="/api/workspace-export?format=schedule-json" download>下载排期 JSON</a><a className="marketing-primary" href="/api/workspace-export?format=schedule-csv" download>下载排期 CSV</a></div>{currentUser.role==='admin'?<><h3>管理员工作区备份</h3><p>包括成员基本资料、平台、内容、任务、内容版本、审核与留言、附件和素材元数据、文字资源及工作区设置。包含已归档记录，不包含私人消息、个人收藏、登录密钥或实际文件；系统不会生成下载签名。文件本身仍需另行备份。</p><a className="marketing-primary" href="/api/workspace-export?format=workspace-json" download>下载工作区资料 JSON</a></>:<p>完整工作区资料只有管理员可以导出。</p>}<p className="marketing-caption">导出不会删除或重置当前资料。</p></>;break;
    default: body=<><h2>{currentUser.name}</h2><p>当前权限：{currentUser.role==='admin'?'管理员':'员工'}</p><p>姓名与头像使用 Slack 登录账号的资料，权限由管理员管理。</p><div className="marketing-settings-account"><span><b>登录账号</b><small>从头像菜单查看账号或退出登录</small></span><UserAccountMenu currentUser={currentUser}/></div><AccountManagement/></>;
  }
  return <MarketingShell currentUser={currentUser} active="settings" title="Settings" description="管理个人资料、通知和工作区偏好。"><div className="marketing-settings-grid marketing-entry"><nav aria-label="设置分类" className="marketing-card">{Object.entries(sections).map(([key,label])=><Link key={key} href={`/marketing/settings/${key}`} aria-current={section===key?'page':undefined}>{label}</Link>)}</nav><section className="marketing-card marketing-settings-content">{body}</section></div></MarketingShell>;
}
