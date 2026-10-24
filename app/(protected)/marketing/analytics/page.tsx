import { MarketingShell } from '@/features/marketing/components/shell';
import { listScheduledContent } from '@/features/schedule/queries';
import { getVerifiedUser } from '@/lib/auth/get-verified-user';
import { buildMarketingSummary, marketingStatusLabels } from '@/features/marketing/page-model';
export default async function MarketingAnalyticsPage() {
  const [currentUser, contents] = await Promise.all([getVerifiedUser(), listScheduledContent()]);
  const { counts } = buildMarketingSummary(contents);
  const platforms = new Map<string, { name: string; count: number; color: string }>();
  for (const item of contents) for (const platform of item.platforms) { const previous = platforms.get(platform.id); platforms.set(platform.id, { name: platform.name, color: platform.color, count: (previous?.count ?? 0) + 1 }); }
  return <MarketingShell currentUser={currentUser} active="analytics" title="Analytics" description="统计现有内容的制作、审核和发布进度。">
    <div className="marketing-stats marketing-entry">{[['内容总数',contents.length],['等待审核',counts.in_review],['等待发布',counts.due],['已经发布',counts.published]].map(([label,value])=><section className="marketing-card" key={label}><span>{label}</span><strong>{value}</strong></section>)}</div>
    <div className="marketing-page-grid marketing-entry"><section className="marketing-card"><h2>内容状态</h2>{Object.entries(marketingStatusLabels).map(([key,label])=><div className="marketing-meter-row" key={key}><label>{label} <span>{counts[key as keyof typeof counts]}</span><meter min={0} max={Math.max(1,contents.length)} value={counts[key as keyof typeof counts]} /></label></div>)}</section><section className="marketing-card"><h2>各平台内容数量</h2>{Array.from(platforms.entries()).map(([id,p])=><div key={id} className="marketing-meter-row"><label>{p.name} <span>{p.count}</span><meter min={0} max={Math.max(1,contents.length)} value={p.count} /></label></div>)}{!platforms.size?<p>还没有内容统计。</p>:null}</section></div>
    <p className="marketing-caption">数据来自内部内容记录；「已经发布」表示团队已确认发布。暂未包含平台触达、粉丝或互动数据。</p>
  </MarketingShell>;
}
