import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HelpChrome } from '@/features/help-center/components/help-chrome';
import { HelpScrollToTop } from '@/features/help-center/gitbook/scroll-to-top';
const state = vi.hoisted(() => ({ path:'/help' }));
vi.mock('next/navigation',()=>({usePathname:()=>state.path,useRouter:()=>({push:vi.fn()})}));
vi.mock('@/features/marketing/components/header-actions',()=>({MarketingHeaderActions:()=>null}));
vi.mock('@/components/auth/user-account-menu',()=>({UserAccountMenu:()=>null}));
const user={id:'employee',name:'测试员工',role:'employee' as const,imageUrl:null};
describe('help center workbench integration',()=>{
 it('uses the same workspace brand and preserves one article heading and its content',()=>{
  state.path='/help/内容排期/建立内容';
  render(<HelpChrome currentUser={user}><article><h1>如何建立内容排期</h1><p>原来的正文</p></article></HelpChrome>);
  expect(screen.getByRole('link',{name:'JUYU 内部工作台'})).toHaveAttribute('href','/marketing');
  expect(screen.getAllByRole('heading',{level:1})).toHaveLength(1);
  expect(screen.getByRole('article')).toHaveTextContent('原来的正文');
  expect(screen.getByRole('searchbox',{name:'搜索帮助文章'})).toBeInTheDocument();
 });
 it('keeps PDF outside workbench navigation',()=>{
  state.path='/help/内容排期/建立内容/pdf';
  render(<HelpChrome currentUser={user}><article>打印内容</article></HelpChrome>);
  expect(screen.queryByRole('link',{name:'JUYU 内部工作台'})).not.toBeInTheDocument();
  expect(screen.getByRole('main')).toHaveTextContent('打印内容');
 });
 it('scrolls the window when the new workbench body is the reading scroller',()=>{
  const scrollTo=vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
  render(<main id="marketing-main"><HelpScrollToTop /></main>);
  Object.defineProperty(screen.getByRole('main'),'scrollTo',{value:vi.fn()});
  fireEvent.click(screen.getByRole('button',{name:'回到顶部'}));
  expect(scrollTo).toHaveBeenCalledWith({top:0,behavior:'smooth'});
  scrollTo.mockRestore();
 });
});
