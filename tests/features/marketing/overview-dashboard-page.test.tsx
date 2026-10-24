import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
const fixtures=vi.hoisted(()=>({tasks:vi.fn(),contents:vi.fn()}));
vi.mock('@/lib/auth/get-verified-user',()=>({getVerifiedUser:async()=>({id:'employee',name:'员工',role:'employee',imageUrl:null})}));
vi.mock('@/features/tasks/repository',()=>({taskRepository:{list:fixtures.tasks}}));
vi.mock('@/features/schedule/queries',()=>({listScheduledContent:fixtures.contents}));
vi.mock('@/features/marketing/queries',()=>({marketingContentQueries:{cover:async()=>null}}));
vi.mock('@/features/marketing/components/shell',()=>({MarketingShell:({children}:{children:React.ReactNode})=><main>{children}</main>}));
import Overview from '@/app/(protected)/marketing/page';
afterEach(()=>{vi.useRealTimers();vi.clearAllMocks();});
describe('Overview loads the existing Dashboard data',()=>{
 it('renders a canonical task and all original summary sections with real detail destinations',async()=>{
  vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-25T02:00:00Z'));
  fixtures.contents.mockResolvedValue([]);fixtures.tasks.mockResolvedValue([{id:'task-id',title:'原有任务',dueAt:'2026-10-25T01:00:00Z',status:'todo',kind:'general',archivedAt:null}]);
  render(await Overview({searchParams:Promise.resolve({})}));
  const today=screen.getByRole('region',{name:'今天要做的任务'});expect(within(today).getByRole('link',{name:/原有任务/})).toHaveAttribute('href','/tasks/task-id');
  expect(within(screen.getByRole('region',{name:'已经过期的任务'})).getByText('原有任务')).toBeInTheDocument();
  for(const name of ['等待上司检查','最近准备发布','超过时间还没发布'])expect(screen.getByRole('region',{name})).toBeInTheDocument();
  expect(screen.getByRole('heading',{name:'The week ahead'})).toBeInTheDocument();
 });
 it('does not turn a failed task query into a misleading zero-count dashboard',async()=>{
  fixtures.contents.mockResolvedValue([]);fixtures.tasks.mockRejectedValue(new Error('TASK_DATABASE_ERROR'));
  await expect(Overview({searchParams:Promise.resolve({})})).rejects.toThrow('TASK_DATABASE_ERROR');
 });
});
