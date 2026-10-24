import Link from 'next/link';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MarketingRouteTransition } from '@/features/marketing/components/route-transition';
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation',()=>({ useRouter:()=>({push}), usePathname:()=>'/marketing' }));
afterEach(()=>{vi.useRealTimers();push.mockReset();});
function setup(reduced=false){vi.stubGlobal('matchMedia',()=>({matches:reduced}));return render(<MarketingRouteTransition><div className="marketing-shell"><main id="marketing-main"><a href="/marketing/calendar">日历</a><a href="/marketing/library">文件库</a><Link href="/tasks/11111111-1111-4111-8111-111111111111">任务详情</Link><Link href="/help">帮助</Link><Link href="/help/guide/pdf">打印</Link><a href="#section">段落</a><a href="/marketing/calendar" download>下载</a></main></div></MarketingRouteTransition>);}
describe('marketing route transitions',()=>{
  it('uses the final destination when clicking rapidly and never leaves the content hidden',()=>{
    vi.useFakeTimers();setup();fireEvent.click(screen.getByText('日历'));fireEvent.click(screen.getByText('文件库'));
    expect(push).not.toHaveBeenCalled();act(()=>vi.advanceTimersByTime(180));expect(push).toHaveBeenCalledExactlyOnceWith('/marketing/library');
    expect(document.querySelector('[data-marketing-leaving]')).not.toBeInTheDocument();
  });
  it('animates existing task detail links that now share the marketing shell',()=>{
    vi.useFakeTimers();setup();fireEvent.click(screen.getByText('任务详情'));act(()=>vi.advanceTimersByTime(180));expect(push).toHaveBeenCalledExactlyOnceWith('/tasks/11111111-1111-4111-8111-111111111111');
  });
  it('does not intercept reduced motion, new tabs, downloads, hashes or print views',()=>{
    vi.useFakeTimers();setup();for(const name of ['打印','段落','下载'])fireEvent.click(screen.getByText(name));fireEvent.click(screen.getByText('日历'),{ctrlKey:true});
    act(()=>vi.runAllTimers());expect(push).not.toHaveBeenCalled();
  });
  it('uses shared transitions for the help reader',()=>{vi.useFakeTimers();setup();fireEvent.click(screen.getByText('帮助'));act(()=>vi.advanceTimersByTime(180));expect(push).toHaveBeenCalledExactlyOnceWith('/help');});
  it('lets Next navigate immediately when reduced motion is enabled',()=>{
    vi.useFakeTimers();setup(true);fireEvent.click(screen.getByText('日历'));act(()=>vi.runAllTimers());expect(push).not.toHaveBeenCalled();
  });
});
