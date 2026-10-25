import {hasPermission} from "@/features/team/permissions";
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { MarketingShell } from '@/features/marketing/components/shell';
import { MarketingContentWorkspace } from '@/features/marketing/components/content-workspace';
import { marketingContentQueries } from '@/features/marketing/queries';
import { DeleteContentButton } from '@/features/content/components/delete-content-button';
import { deleteScheduledContent } from '@/features/content/actions/content';

const labels = {draft:'草稿',in_review:'等待审核',changes_requested:'需要修改',approved:'已经批准',due:'等待发布',published:'已经发布',archived:'已经收起'};
export default async function MarketingContentDetailPage({ params }: { params: Promise<{contentId:string}> }) {
  const { contentId }=await params;
  const detail=await marketingContentQueries.detail(contentId);
  if (!detail) {
    // Room permission changes can refresh this route before the initiating
    // action's client callback. Handle archived links at the server boundary.
    if (await marketingContentQueries.isArchived(contentId)) redirect('/marketing/calendar?view=list');
    notFound();
  }
  const { content }=detail;
  return <MarketingShell currentUser={detail.currentUser} active={content.status === 'in_review' ? 'approvals' : 'compose'} title={content.title} description="内容正文、指定文字留言、文件与审核记录。">
    <section className="marketing-summary marketing-entry">
      <div className="marketing-pills"><span className={`marketing-status status-${content.status}`}>{labels[content.status]}</span>{detail.platforms.filter(p=>detail.platformIds.includes(p.id)).map(p=><span key={p.id}><i style={{background:p.color}}/>{p.name}</span>)}</div>
      <dl><div><dt>负责人</dt><dd>{detail.assignees.find(m=>m.id===content.assigneeId)?.name ?? '未找到负责人'}</dd></div><div><dt>发布时间 · 马来西亚</dt><dd>{new Intl.DateTimeFormat('zh-MY',{timeZone:'Asia/Kuala_Lumpur',dateStyle:'medium',timeStyle:'short'}).format(new Date(content.publishAt))}</dd></div><div><dt>审核版本</dt><dd>{content.currentVersion > 0 ? `第 ${content.currentVersion} 版` : '尚未送审'}</dd></div></dl>
      <div className="marketing-toolbar"><Link href="/marketing/calendar?view=list">← 返回内容列表</Link>{hasPermission(detail.currentUser,'content.delete') && (hasPermission(detail.currentUser,'content.manage_all') || content.authorId === detail.currentUser.id) ? <DeleteContentButton contentId={content.id} deleteAction={deleteScheduledContent} redirectTo="/marketing/calendar?view=list" /> : null}</div>
    </section>
    <div className="marketing-entry"><MarketingContentWorkspace detail={detail}/></div>
  </MarketingShell>;
}
