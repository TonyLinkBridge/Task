import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarketingShell } from '@/features/marketing/components/shell';
import { ThemeToggle } from '@/components/theme-toggle';
import { UserAccountMenu } from '@/components/auth/user-account-menu';
import { SlackSettingsForm } from '@/features/admin/components/slack-settings-form';
import { adminRepository } from '@/features/admin/repository';
import { saveNotificationSettings } from '@/features/admin/actions/notification-settings';
import { listScheduledContent } from '@/features/schedule/queries';
import { buildMarketingSummary } from '@/features/marketing/page-model';
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
    case 'workspace': body=<><h2>JUYU 内部工作台</h2><p>团队通过指定 Slack 工作区登入，共用现有内容、任务和帮助资料。</p><Link href="/marketing/team">查看团队 →</Link></>;break;
    case 'approvals': body=<><h2>当前审核规则</h2><p>员工提交的内容，需要两位不同管理员批准。改动后重新提交，会开始新的审核版本，旧批准不计入新版本。</p><p>管理员可以自己通过，或交给另一位管理员检查。审核决定和修改记录都会保留。</p><Link href="/marketing/approvals">打开审核列表 →</Link></>;break;
    case 'security': body=<><h2>账号安全</h2><p>通过指定 Slack 工作区登录，账号权限由管理员分配。</p><div className="marketing-settings-account"><span><b>登录账号</b><small>从头像菜单查看账号或退出登录</small></span><UserAccountMenu currentUser={currentUser}/></div></>;break;
    case 'billing': body=<><h2>没有收费或订阅功能</h2><p>这是团队内部工作台，目前没有收费套餐、信用卡或发票功能。</p></>;break;
    case 'appearance': body=<><h2>深色与浅色模式</h2><p>切换后会保存在当前浏览器。动画会尊重设备的减少动态效果设置。</p><ThemeToggle/></>;break;
    case 'data': {
      const contents=await listScheduledContent();
      const summary=buildMarketingSummary(contents);
      const report={generatedAt:new Date().toISOString(),timezone:'Asia/Kuala_Lumpur',counts:summary.counts,contents};
      body=<><h2>导出当前内容排期</h2><p>导出当前可见内容的标题、排期、平台和状态；不包含登录密钥或历史文件。</p><a className="marketing-primary" download="juyu-content-schedule.json" href={'data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(report,null,2))}>下载内容排期 JSON</a></>;break;
    }
    default: body=<><h2>{currentUser.name}</h2><p>当前权限：{currentUser.role==='admin'?'管理员':'员工'}</p><p>姓名与头像使用 Slack 登录账号的资料，权限由管理员管理。</p><div className="marketing-settings-account"><span><b>登录账号</b><small>从头像菜单查看账号或退出登录</small></span><UserAccountMenu currentUser={currentUser}/></div></>;
  }
  return <MarketingShell currentUser={currentUser} active="settings" title="Settings" description="管理个人资料、通知和工作区偏好。"><div className="marketing-settings-grid marketing-entry"><nav aria-label="设置分类" className="marketing-card">{Object.entries(sections).map(([key,label])=><Link key={key} href={`/marketing/settings/${key}`} aria-current={section===key?'page':undefined}>{label}</Link>)}</nav><section className="marketing-card marketing-settings-content">{body}</section></div></MarketingShell>;
}
