import{render,screen,waitFor}from'@testing-library/react';
import userEvent from'@testing-library/user-event';
import{beforeEach,describe,expect,it,vi}from'vitest';
const mock=vi.hoisted(()=>({signIn:{id:null as string|null,status:'needs_identifier',firstFactorVerification:{status:null as string|null,externalVerificationRedirectURL:null as string|null},reset:vi.fn(),sso:vi.fn()},loaded:true,fetchStatus:'idle'}));
vi.mock('@clerk/nextjs',()=>({useSignIn:()=>({signIn:mock.signIn,fetchStatus:mock.fetchStatus}),useClerk:()=>({loaded:mock.loaded})}));
import{SlackLoginButton}from'@/components/auth/slack-login-button';
beforeEach(()=>{mock.loaded=true;mock.fetchStatus='idle';mock.signIn.id=null;mock.signIn.status='needs_identifier';mock.signIn.firstFactorVerification={status:null,externalVerificationRedirectURL:null};mock.signIn.reset.mockReset().mockResolvedValue({error:null});mock.signIn.sso.mockReset().mockResolvedValue({error:null});});
describe('Slack login retry recovery',()=>{
 it('clears an expired, non-redirectable attempt before starting Slack again',async()=>{
  mock.signIn.id='stale-sign-in';mock.signIn.firstFactorVerification.status='expired';
  const staleSso=mock.signIn.sso;const freshSso=vi.fn().mockResolvedValue({error:null});
  mock.signIn.reset.mockImplementation(()=>{mock.signIn={...mock.signIn,id:null,firstFactorVerification:{status:null,externalVerificationRedirectURL:null},sso:freshSso};return Promise.resolve({error:null});});
  render(<SlackLoginButton redirectTo="/marketing"/>);await userEvent.click(screen.getByRole('button',{name:'使用 JUYU Slack 继续'}));
  await waitFor(()=>expect(mock.signIn.sso).toHaveBeenCalled());expect(mock.signIn.reset).toHaveBeenCalledOnce();
  expect(mock.signIn.reset.mock.invocationCallOrder[0]).toBeLessThan(mock.signIn.sso.mock.invocationCallOrder[0]);
  expect(staleSso).not.toHaveBeenCalled();
 });
 it('does not reset a fresh attempt or a live redirect',async()=>{
  mock.signIn.id='active-sign-in';mock.signIn.firstFactorVerification={status:'unverified',externalVerificationRedirectURL:'https://slack.com/oauth'};
  render(<SlackLoginButton redirectTo="/marketing"/>);await userEvent.click(screen.getByRole('button',{name:'使用 JUYU Slack 继续'}));
  await waitFor(()=>expect(mock.signIn.sso).toHaveBeenCalled());expect(mock.signIn.reset).not.toHaveBeenCalled();
 });
 it('does not leave the button spinning when the SDK returns without navigating',async()=>{
  render(<SlackLoginButton redirectTo="/marketing"/>);await userEvent.click(screen.getByRole('button',{name:'使用 JUYU Slack 继续'}));
  await waitFor(()=>expect(screen.getByRole('button',{name:'使用 JUYU Slack 继续'})).toBeEnabled());
 });
 it('waits for Clerk before allowing a login attempt',()=>{
  mock.loaded=false;render(<SlackLoginButton redirectTo="/marketing"/>);expect(screen.getByRole('button',{name:'正在打开 Slack…'})).toBeDisabled();expect(mock.signIn.sso).not.toHaveBeenCalled();
 });
});
