import { MarketingIcon } from '@/features/marketing/components/icon';
import { MarketingContentCards } from '@/features/marketing/components/content-cards';
import { MarketingShell } from '@/features/marketing/components/shell';
import { listScheduledContent } from '@/features/schedule/queries';
import { getVerifiedUser } from '@/lib/auth/get-verified-user';
export default async function MarketingApprovalsPage() {
  const [currentUser, contents] = await Promise.all([getVerifiedUser(), listScheduledContent({ status: 'in_review' })]);
  return <MarketingShell currentUser={currentUser} active="approvals" title="Approvals" description="查看当前等待审核的版本；员工提交需要两位管理员分别批准。">
    <div className="marketing-toolbar marketing-entry"><p>{contents.length} 条等待审核</p><p>打开内容后核对正文、文件和留言，再作决定。</p></div>
    {contents.length ? <MarketingContentCards contents={contents} /> : <div className="marketing-card marketing-entry marketing-page-empty"><span className="marketing-empty-mark"><MarketingIcon name="check"/></span><h2>暂时没有内容等待审核</h2><p>新的送审内容会出现在这里。</p></div>}
  </MarketingShell>;
}
