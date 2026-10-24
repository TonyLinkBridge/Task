import Link from 'next/link';
import { MarketingShell } from '@/features/marketing/components/shell';
import { getVerifiedUser } from '@/lib/auth/get-verified-user';
export default async function MarketingListeningPage() {
  const currentUser = await getVerifiedUser();
  return <MarketingShell currentUser={currentUser} active="listening" title="Listening" description="记录需要跟进的品牌和市场动态。"><section className="marketing-card marketing-entry"><h2>尚未连接外部监测来源</h2><p>目前还没有连接外部品牌提及、情绪或竞品监测。</p><p>如果团队先手动跟进某个主题，可以用普通任务记录负责人和进度。</p><Link className="marketing-primary" href="/marketing/tasks">建立跟进任务</Link></section></MarketingShell>;
}
