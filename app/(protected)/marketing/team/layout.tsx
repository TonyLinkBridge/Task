import {getVerifiedUser}from'@/lib/auth/get-verified-user';
import {teamRepository}from'@/features/team/repository';
import {TeamWorkspace}from'@/features/team/components/workspace';
export default async function TeamLayout({children}:{children:React.ReactNode}){const user=await getVerifiedUser();const snapshot=await teamRepository.snapshot(user.id);return <TeamWorkspace currentUser={user} initial={snapshot}>{children}</TeamWorkspace>;}
