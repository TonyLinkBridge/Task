import {getVerifiedUser} from '@/lib/auth/get-verified-user';
import {profileRepository} from '@/features/workspace-settings/profile-repository';
import {SettingsWorkspace} from '@/features/workspace-settings/components/settings-workspace';
import {adminRepository} from '@/features/admin/repository';
import {hasPermission} from '@/features/team/permissions';
export default async function SettingsLayout({children}:{children:React.ReactNode}){
 const user=await getVerifiedUser();
 const [profile,members]=await Promise.all([profileRepository.load(user.id),adminRepository.listMembers()]);
 return <SettingsWorkspace initial={profile} currentUser={user} memberCount={members.length} approverCount={members.filter(m=>hasPermission(m,'content.approve')).length}>{children}</SettingsWorkspace>;
}
