"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MarketingShell } from "@/features/marketing/components/shell";
import { MarketingRouteTransition } from "@/features/marketing/components/route-transition";
import { HelpSearchInput } from "../gitbook/search-input";
import type { VerifiedUser } from "@/lib/auth/types";

export function HelpChrome({ currentUser, children }: { currentUser: VerifiedUser; children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.endsWith("/pdf")) return <main className="min-h-screen bg-background">{children}</main>;
  const showSearch = pathname !== '/help' && pathname !== '/help/search';
  return <MarketingRouteTransition>
    <MarketingShell currentUser={currentUser} active="help" title="帮助中心" description="Marketing 团队的流程、规则和操作说明" hero={
      <div className="marketing-help-heading">
        <div><Link href="/help" className="marketing-help-name">帮助中心</Link><p>Marketing 团队的流程、规则和操作说明</p></div>
        {showSearch ? <HelpSearchInput /> : null}
      </div>
    }>
      <div className="marketing-help marketing-entry">{children}</div>
    </MarketingShell>
  </MarketingRouteTransition>;
}
