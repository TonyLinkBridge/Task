import Link from "next/link";
import {hasPermission} from "@/features/team/permissions";
import { createScheduledContent } from '@/features/content/actions/content';
import { MarketingCreateContent } from '@/features/marketing/components/create-content';
import { MarketingShell } from '@/features/marketing/components/shell';
import { marketingContentQueries } from '@/features/marketing/queries';

export default async function MarketingNewContentPage() {
  const data = await marketingContentQueries.creation();
  if(!hasPermission(data.currentUser,"content.write"))return <MarketingShell currentUser={data.currentUser} active="compose" title="Compose" description="建立和安排团队内容。"><section className="marketing-card"><h2>你目前没有撰写内容的权限。</h2><p>可以到团队与权限页面查看自己的角色，或联系团队管理员调整。</p><Link href="/marketing/team">查看团队与权限 →</Link></section></MarketingShell>;
  return <MarketingShell currentUser={data.currentUser} active="compose" title="Compose" description="建立内容，填写正文和文件，再交给管理员检查。">
    <div className="marketing-create-grid marketing-entry">
      <section className="marketing-create-panel"><h2>建立排期内容</h2><p>选择平台、负责人和发布时间。</p>
        <MarketingCreateContent platforms={data.platforms} assignees={data.assignees} createAction={createScheduledContent} />
      </section>
      <aside className="marketing-card"><h2>审核流程</h2><p>员工提交的内容，需要两位管理员分别批准。</p><ol className="marketing-flow"><li>填写正文和上传文件</li><li>交给上司检查</li><li>两位管理员分别批准</li><li>到了时间后跟进发布</li></ol><p>指定文字留言、修改记录和审核版本会一起保留。</p></aside>
    </div>
  </MarketingShell>;
}
