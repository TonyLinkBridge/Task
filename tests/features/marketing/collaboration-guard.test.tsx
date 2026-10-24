import {act,fireEvent,render,screen} from '@testing-library/react';
import {describe,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({status:'connected',reconnect:vi.fn(),listener:vi.fn() as (error:unknown)=>void}));
vi.mock('@liveblocks/react',()=>({useStatus:()=>state.status,useRoom:()=>({reconnect:state.reconnect}),useErrorListener:(callback:(error:unknown)=>void)=>{state.listener=callback;}}));
import {MarketingCollaborationGuard} from '@/features/marketing/components/collaboration-guard';
describe('marketing collaboration failure recovery',()=>{
 it('keeps editing available while connected but blocks interaction and warns after a failed save',()=>{
  render(<MarketingCollaborationGuard><textarea aria-label="测试正文"/></MarketingCollaborationGuard>);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  act(()=>state.listener(new Error('Unauthorized')));
  expect(screen.getByRole('alert')).toHaveTextContent('尚未确认保存');
  expect(screen.getByLabelText('测试正文').parentElement).toHaveAttribute('inert');
  fireEvent.click(screen.getByRole('button',{name:'重新连接'}));
  expect(state.reconnect).toHaveBeenCalledOnce();
 });
 it('warns on a lost connection even if no error event was delivered',()=>{
  state.status='disconnected';
  render(<MarketingCollaborationGuard><span>正文</span></MarketingCollaborationGuard>);
  expect(screen.getByRole('alert')).toHaveTextContent('尚未确认保存');
  state.status='connected';
 });
});
