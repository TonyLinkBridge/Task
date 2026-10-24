import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MarketingMotion } from '@/features/marketing/components/motion';
vi.mock('next/navigation',()=>({usePathname:()=>'/marketing'}));
describe('marketing motion fallback',()=>{
  it('keeps the page usable when the optional animation asset cannot load',async()=>{
    vi.stubGlobal('matchMedia',()=>({matches:false}));
    render(<MarketingMotion><h1>可读内容</h1><button>继续处理</button></MarketingMotion>);
    await vi.waitFor(()=>expect(screen.getByTestId('marketing-motion')).toHaveAttribute('data-motion-state','ready'));
    expect(screen.getByRole('heading',{name:'可读内容'})).toBeVisible();expect(screen.getByRole('button',{name:'继续处理'})).toBeEnabled();
  });
  it('skips animations for people who request reduced motion',()=>{
    vi.stubGlobal('matchMedia',()=>({matches:true}));
    render(<MarketingMotion><h1>直接显示</h1></MarketingMotion>);
    expect(screen.getByTestId('marketing-motion')).toHaveAttribute('data-motion-state','ready');
    expect(screen.getByRole('heading')).toBeVisible();
  });
});
