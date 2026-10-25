import Link from 'next/link';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MarketingRouteTransition } from '@/features/marketing/components/route-transition';
const { push, prefetch } = vi.hoisted(() => ({ push: vi.fn(), prefetch: vi.fn() }));
vi.mock('next/navigation',()=>({ useRouter:()=>({push,prefetch}), usePathname:()=>'/marketing' }));
afterEach(()=>{vi.useRealTimers();push.mockReset();prefetch.mockReset();window.history.replaceState({},'','/');});
function setup(reduced=false){vi.stubGlobal('matchMedia',()=>({matches:reduced}));return render(<MarketingRouteTransition><div className="marketing-shell"><main id="marketing-main"><a href="/marketing/calendar">日历</a><a href="/marketing/library">文件库</a><Link href="/tasks/11111111-1111-4111-8111-111111111111">任务详情</Link><Link href="/help">帮助</Link><Link href="/help/guide/pdf">打印</Link><a href="#section">段落</a><a href="/marketing/calendar" download>下载</a></main></div></MarketingRouteTransition>);}
describe('marketing route transitions',()=>{
  it('starts navigation immediately and never hides content while waiting',()=>{
    vi.useFakeTimers();setup();fireEvent.click(screen.getByText('日历'));fireEvent.click(screen.getByText('文件库'));
    expect(push).toHaveBeenNthCalledWith(1,'/marketing/calendar');expect(push).toHaveBeenLastCalledWith('/marketing/library');
    expect(document.querySelector('[data-marketing-leaving]')).not.toBeInTheDocument();
  });
  it('navigates existing task detail links immediately through the shared shell',()=>{
    vi.useFakeTimers();setup();fireEvent.click(screen.getByText('任务详情'));expect(push).toHaveBeenCalledExactlyOnceWith('/tasks/11111111-1111-4111-8111-111111111111');
  });
  it('does not intercept reduced motion, new tabs, downloads, hashes or print views',()=>{
    vi.useFakeTimers();setup();for(const name of ['打印','段落','下载'])fireEvent.click(screen.getByText(name));fireEvent.click(screen.getByText('日历'),{ctrlKey:true});
    act(()=>vi.runAllTimers());expect(push).not.toHaveBeenCalled();
  });
  it('uses shared transitions for the help reader',()=>{vi.useFakeTimers();setup();fireEvent.click(screen.getByText('帮助'));expect(push).toHaveBeenCalledExactlyOnceWith('/help');});
  it('lets Next navigate immediately when reduced motion is enabled',()=>{
    vi.useFakeTimers();setup(true);fireEvent.click(screen.getByText('日历'));act(()=>vi.runAllTimers());expect(push).not.toHaveBeenCalled();
  });
});

it('prepares a destination on pointer or keyboard intent, without repeating the same warm-up',()=>{setup();fireEvent.mouseOver(screen.getByText('日历'));fireEvent.focusIn(screen.getByText('日历'));expect(prefetch).toHaveBeenCalledExactlyOnceWith('/marketing/calendar');fireEvent.focusIn(screen.getByText('文件库'));expect(prefetch).toHaveBeenLastCalledWith('/marketing/library');});
it('does not prefetch downloads, print views or in-page anchors',()=>{setup();for(const name of ['打印','段落','下载'])fireEvent.mouseOver(screen.getByText(name));expect(prefetch).not.toHaveBeenCalled();});

it('refreshes an intent prefetch after its short cooldown and supports touch',()=>{vi.useFakeTimers();setup();const link=screen.getByText('日历');fireEvent.touchStart(link);fireEvent.mouseOver(link);expect(prefetch).toHaveBeenCalledTimes(1);act(()=>vi.advanceTimersByTime(30_000));fireEvent.mouseOver(link);expect(prefetch).toHaveBeenCalledTimes(2);});
it('still navigates if warming a page fails',()=>{setup();prefetch.mockImplementationOnce(()=>{throw new Error('offline');});fireEvent.mouseOver(screen.getByText('日历'));fireEvent.click(screen.getByText('日历'));expect(push).toHaveBeenCalledExactlyOnceWith('/marketing/calendar');});

it('keeps settings in the existing shell without cloning the whole page or resetting scroll',()=>{
 vi.stubGlobal('matchMedia',()=>({matches:false}));window.history.replaceState({},'','/marketing/settings/profile');
 render(<MarketingRouteTransition><div className="marketing-shell"><main id="marketing-main"><Link href="/marketing/settings/appearance">外观</Link></main></div></MarketingRouteTransition>);
 const clone=vi.spyOn(document.getElementById('marketing-main')!,'cloneNode');
 fireEvent.click(screen.getByText('外观'));
 expect(push).toHaveBeenCalledExactlyOnceWith('/marketing/settings/appearance',{scroll:false});expect(clone).not.toHaveBeenCalled();
});
