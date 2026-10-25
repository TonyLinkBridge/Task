import {expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({cache:vi.fn((fn:unknown)=>fn),auth:vi.fn(),user:vi.fn(),upsert:vi.fn(async()=>({error:null}))}));
vi.mock('react',async original=>({...await original<typeof import('react')>(),cache:mocks.cache}));
vi.mock('@clerk/nextjs/server',()=>({auth:mocks.auth,clerkClient:async()=>({users:{getUser:mocks.user}})}));
vi.mock('@/lib/env/server',()=>({getServerEnv:()=>({ALLOWED_SLACK_TEAM_ID:'T094DTFCVA8'})}));
vi.mock('@/lib/supabase/admin',()=>({getSupabaseAdmin:()=>({from:()=>({upsert:mocks.upsert})})}));
import {getVerifiedUser} from '@/lib/auth/get-verified-user';
it('creates one React request-scoped reader and still resolves the current account’s actual role',async()=>{
 expect(mocks.cache).toHaveBeenCalledTimes(1);
 mocks.auth.mockResolvedValueOnce({userId:'admin'}).mockResolvedValueOnce({userId:'employee'});
 mocks.user.mockImplementation(async(id:string)=>({id,firstName:id,lastName:null,username:null,imageUrl:null,publicMetadata:{role:id==='admin'?'admin':'employee',slackTeamId:'T094DTFCVA8',slackVerifiedAt:'2026-10-25T00:00:00Z'}}));
 expect((await getVerifiedUser()).role).toBe('admin');expect((await getVerifiedUser()).role).toBe('employee');
 expect(mocks.upsert).toHaveBeenCalledTimes(2);
});
