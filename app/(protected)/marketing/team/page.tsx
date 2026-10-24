import { MarketingShell } from '@/features/marketing/components/shell';
import { MemberList } from '@/features/admin/components/member-list';
import { taskRepository } from '@/features/tasks/repository';
import { getVerifiedUser } from '@/lib/auth/get-verified-user';
export default async function MarketingTeamPage() {
  const currentUser = await getVerifiedUser();
  const members = await taskRepository.listAssignees();
  return <MarketingShell currentUser={currentUser} active="team" title="Team & roles" description="查看团队成员及各自的权限。"><div className="marketing-entry"><MemberList members={members} /></div></MarketingShell>;
}
