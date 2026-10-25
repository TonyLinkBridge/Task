import {hasPermission} from "@/features/team/permissions";
import { MarketingShell } from '@/features/marketing/components/shell';
import { PlatformSettings } from '@/features/admin/components/platform-settings';
import { createPlatform, updatePlatform, archivePlatform, restorePlatform } from '@/features/admin/actions/platforms';
import { contentRepository } from '@/features/content/repository';
import { getVerifiedUser } from '@/lib/auth/get-verified-user';
export default async function MarketingChannelsPage() {
  const currentUser = await getVerifiedUser();
  const platforms = hasPermission(currentUser,'channels.manage') ? await contentRepository.listAllPlatforms() : await contentRepository.listPlatforms();
  return <MarketingShell currentUser={currentUser} active="channels" title="Channels" description="管理你们自己的发布平台名称和颜色。">
    <div className="marketing-entry">{hasPermission(currentUser,'channels.manage') ? <PlatformSettings initialPlatforms={platforms} createPlatformAction={createPlatform} updatePlatformAction={updatePlatform} archivePlatformAction={archivePlatform} restorePlatformAction={restorePlatform} /> : <section className="marketing-card"><h2>发布平台</h2><p>只有管理员可以新增、改名或停用平台。</p><div className="marketing-pills">{platforms.map(p => <span key={p.id}><i style={{ background: p.color }} />{p.name}</span>)}</div></section>}</div>
    <p className="marketing-caption">平台名称用于排期和审核。目前没有连接社交账号或自动发布权限。</p>
  </MarketingShell>;
}
