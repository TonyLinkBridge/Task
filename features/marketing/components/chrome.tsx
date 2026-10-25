'use client';
import Link from 'next/link';
import {WorkspaceBrandCopy} from '@/features/workspace-settings/components/provider';
import Image from 'next/image';
import { MarketingTabs, MarketingNavigation, type MarketingPage } from './navigation';
import type { VerifiedUser } from '@/lib/auth/types';
import { MarketingHeaderActions } from './header-actions';
import { UserAccountMenu } from '@/components/auth/user-account-menu';


export function MarketingChrome({currentUser,active,pendingActive}:{currentUser:VerifiedUser;active:MarketingPage;pendingActive?:MarketingPage}){return <>
      <div className="marketing-mesh" aria-hidden="true"><i /><i /><i /></div>
      <a className="marketing-skip" href="#marketing-main">跳到正文</a>
      <header className="marketing-top">
        <Link href="/marketing" className="marketing-brand">
          <span className="marketing-brand-symbol">
            <Image src="/mascots/chiikawa-peek.png" alt="" aria-hidden="true" width={384} height={384} priority draggable={false} className="marketing-brand-mascot" />
            <span className="marketing-brand-mark" aria-hidden="true">J</span>
          </span>
          <WorkspaceBrandCopy/>
        </Link>
        <MarketingTabs active={active} pendingActive={pendingActive} />
        <div className="marketing-account"><MarketingHeaderActions /><UserAccountMenu currentUser={currentUser} /><span className="marketing-account-name">{currentUser.name}<small>{currentUser.role === 'admin' ? '管理员' : '员工'}</small></span></div>
      </header>
      <MarketingNavigation active={active} role={currentUser.role} />

</>;}
