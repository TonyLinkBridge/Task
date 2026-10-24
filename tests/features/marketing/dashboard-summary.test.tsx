import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildDashboardSummary } from '@/features/marketing/dashboard-summary';
import { DashboardSummary } from '@/features/marketing/components/dashboard-summary';
import type { TaskRecord } from '@/features/tasks/types';
import type { ScheduledContent } from '@/features/schedule/types';
const now=new Date('2026-10-25T02:00:00Z');
const task=(id:string,dueAt:string,status:TaskRecord['status']='todo',extra:Partial<TaskRecord>={}):TaskRecord=>({id,title:id,project:'一般',description:'',status,priority:'medium',kind:'general',assigneeId:'employee',creatorId:'employee',dueAt,position:1000,linkedContentId:null,archivedAt:null,createdAt:now.toISOString(),updatedAt:now.toISOString(),...extra});
const content=(id:string,publishAt:string,status:ScheduledContent['status']):ScheduledContent=>({id,title:id,publishAt,status,storedStatus:status,assignee:{id:'employee',name:'员工',imageUrl:null},platforms:[],requiredApprovals:2,approvalAdminIds:[]});
describe('legacy Dashboard summaries integrated into Overview',()=>{
 it('uses Malaysia today and excludes done and archived tasks while retaining overlapping overdue-today tasks',()=>{
  const summary=buildDashboardSummary([
   task('yesterday','2026-10-24T15:59:59Z'),task('today-midnight','2026-10-24T16:00:00Z'),task('today-later','2026-10-25T15:59:59Z'),task('tomorrow','2026-10-25T16:00:00Z'),task('done','2026-10-25T01:00:00Z','done'),task('archived','2026-10-25T01:00:00Z','todo',{archivedAt:now.toISOString()}),task('publish-task','2026-10-25T12:00:00Z','todo',{kind:'content_publish',linkedContentId:'linked'}),task('equal-now','2026-10-25T02:00:00Z')
  ],[],now);
  expect(summary.todayTasks.map(x=>x.id)).toEqual(['today-midnight','equal-now','publish-task','today-later']);
  expect(summary.overdueTasks.map(x=>x.id)).toEqual(['yesterday','today-midnight']);
 });
 it('preserves every original content bucket including past draft/review and the exact-now boundary',()=>{
  const summary=buildDashboardSummary([], [content('review-future','2026-10-26T01:00:00Z','in_review'),content('review-past','2026-10-24T01:00:00Z','in_review'),content('approved-future','2026-10-25T03:00:00Z','approved'),content('draft-future','2026-10-25T03:00:00Z','draft'),content('draft-now','2026-10-25T02:00:00Z','draft'),content('due-past','2026-10-25T01:00:00Z','due'),content('published-past','2026-10-24T01:00:00Z','published')],now);
  expect(summary.waitingReview.map(x=>x.id)).toEqual(['review-past','review-future']);
  expect(summary.upcoming.map(x=>x.id)).toEqual(['approved-future']);
  expect(summary.missedPublish.map(x=>x.id)).toEqual(['review-past','due-past','draft-now']);
 });
 it('shows all five empty states rather than omitting a legacy summary',()=>{
  render(<DashboardSummary summary={buildDashboardSummary([],[],now)} />);
  for(const name of ['今天要做的任务','已经过期的任务','等待上司检查','最近准备发布','超过时间还没发布'])expect(screen.getByRole('region',{name})).toBeInTheDocument();
  expect(screen.getByText('今天没有到期任务')).toBeInTheDocument();expect(screen.getByText('没有过期任务')).toBeInTheDocument();expect(screen.getByText('没有内容在等检查')).toBeInTheDocument();expect(screen.getByText('没有即将发布的内容')).toBeInTheDocument();expect(screen.getByText('没有漏掉的发布内容')).toBeInTheDocument();
 });
 it('keeps the full count and remaining links while opening the existing new-chrome detail routes',()=>{
  const tasks=Array.from({length:7},(_,i)=>task('task-'+i,'2026-10-25T12:00:00Z'));
  const contents=[content('review','2026-10-26T01:00:00Z','in_review')];render(<DashboardSummary summary={buildDashboardSummary(tasks,contents,now)}/>);
  const today=screen.getByRole('region',{name:'今天要做的任务'});
  expect(within(today).getByText('7')).toBeInTheDocument();expect(within(today).getByRole('link',{name:/task-0/})).toHaveAttribute('href','/tasks/task-0');
  expect(within(today).getByText('展开其余 2 项')).toBeInTheDocument();expect(today.querySelector('details a[href="/tasks/task-6"]')).not.toBeNull();
  expect(within(screen.getByRole('region',{name:'等待上司检查'})).getByRole('link',{name:/review/})).toHaveAttribute('href','/marketing/content/review');
 });
});
