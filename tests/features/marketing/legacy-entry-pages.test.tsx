import { beforeEach, describe, expect, it, vi } from 'vitest';
const state=vi.hoisted(()=>({user:{role:'employee'},signedIn:false}));
vi.mock('next/navigation',()=>({redirect:(path:string)=>{throw Error('REDIRECT:'+path);}}));
vi.mock('@/lib/auth/get-verified-user',()=>({getVerifiedUser:async()=>state.user}));
vi.mock('@clerk/nextjs/server',()=>({auth:async()=>({userId:state.signedIn?'test-user':null})}));
vi.mock('@/components/auth/slack-login-button',()=>({SlackLoginButton:()=>null}));
import Home from '@/app/page';
import Tasks from '@/app/(protected)/tasks/page';
import Dashboard from '@/app/(protected)/dashboard/page';
import Content from '@/app/(protected)/content/page';
import NewContent from '@/app/(protected)/content/new/page';
import ContentDetail from '@/app/(protected)/content/[contentId]/page';
import Settings from '@/app/(protected)/admin/settings/page';
import History from '@/app/(protected)/admin/history/page';
import Login from '@/app/login/[[...login]]/page';
beforeEach(()=>{state.user.role='employee';state.signedIn=false;});
describe('legacy entry points use the new workspace',()=>{
 it('root and dashboard enter Overview',async()=>{
  expect(()=>Home()).toThrow('REDIRECT:/marketing');
  await expect(Dashboard({searchParams:Promise.resolve({source:'saved'})})).rejects.toThrow('REDIRECT:/marketing?source=saved');
 });
 it('keeps repeated task filters and content filters on their new lists',async()=>{
  await expect(Tasks({searchParams:Promise.resolve({project:'入口验收',assignee:['a','b']})})).rejects.toThrow('REDIRECT:/marketing/tasks?project=%E5%85%A5%E5%8F%A3%E9%AA%8C%E6%94%B6&assignee=a&assignee=b');
  await expect(Content({searchParams:Promise.resolve({status:'draft'})})).rejects.toThrow('REDIRECT:/marketing/calendar?view=list&status=draft');
 });
 it('keeps old create and detail links on the same content',async()=>{
  await expect(NewContent({searchParams:Promise.resolve({platform:'x'})})).rejects.toThrow('REDIRECT:/marketing/content/new?platform=x');
  await expect(ContentDetail({params:Promise.resolve({contentId:'abc-123'}),searchParams:Promise.resolve({version:'2'})})).rejects.toThrow('REDIRECT:/marketing/content/abc-123?version=2');
 });
 it('preserves administrator-only restrictions before redirecting old admin links',async()=>{
  await expect(Settings()).rejects.toThrow('REDIRECT:/access-denied?reason=admin-only');
  await expect(History()).rejects.toThrow('REDIRECT:/access-denied?reason=admin-only');
  state.user.role='admin';
  await expect(Settings()).rejects.toThrow('REDIRECT:/marketing/settings/notifications');
  await expect(History()).rejects.toThrow('REDIRECT:/marketing/history');
 });
 it('already signed-in users go directly to their new destination',async()=>{
  state.signedIn=true;
  await expect(Login({searchParams:Promise.resolve({})})).rejects.toThrow('REDIRECT:/marketing');
  await expect(Login({searchParams:Promise.resolve({redirect:'/content/abc-123?version=2'})})).rejects.toThrow('REDIRECT:/marketing/content/abc-123?version=2');
 });
});
