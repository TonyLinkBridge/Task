import 'server-only';
import {clerkClient} from '@clerk/nextjs/server';
import {getServerEnv} from '@/lib/env/server';
export async function deliverTeamInvite(email:string,inviteId:string){
 const base=getServerEnv().NEXT_PUBLIC_APP_URL;
 if(!base)throw Error('TEAM_APP_URL_MISSING');
 const result=await(await clerkClient()).invitations.createInvitation({emailAddress:email,expiresInDays:7,notify:true,ignoreExisting:true,redirectUrl:new URL('/login',base).toString(),publicMetadata:{taskTeamInviteId:inviteId}});
 return{id:result.id};
}
export async function revokeTeamInvite(id:string){await(await clerkClient()).invitations.revokeInvitation(id);}
